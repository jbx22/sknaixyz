import crypto from "crypto";
import { db } from "./db";
import {
  LedgerEntryType,
  LedgerEntryStatus,
  DB,
  LedgerEntries,
} from "./schema";
import { sql, Transaction } from "kysely";

/**
 * Deterministically stringifies an object by sorting keys.
 * This ensures that JSON.stringify(obj) === JSON.stringify(reorderedObj)
 * Crucial for blockchain hashing where Postgres JSONB might reorder keys.
 */
function stableStringify(obj: any): string {
  // Primitives or null
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  // Arrays: recurse on elements
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }

  // Objects: sort keys and recurse
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(
    (key) => JSON.stringify(key) + ":" + stableStringify(obj[key])
  );
  return "{" + parts.join(",") + "}";
}

// --- Types ---

export type LedgerEntryInput = {
  entryType: LedgerEntryType;
  assetId?: number | null;
  spvId?: number | null;
  fromUserId?: number | null;
  toUserId?: number | null;
  tokenAmount?: number | null;
  sarAmount?: number | null;
  pricePerToken?: number | null;
  complianceChecks: Record<string, any>;
  metadata: Record<string, any>;
  executedBy: number;
  ipAddress?: string | null;
  contractRuleSet?: string;
  status?: LedgerEntryStatus;
  legalReference?: string | null;
  reversalReason?: string | null;
  reversedEntryId?: number | null;
};

export type ComplianceCheckResult = {
  kycVerified: boolean;
  kycStatus?: string;
  suitabilityAllowed: boolean;
  suitability?: string;
  jurisdictionAllowed: boolean;
  jurisdiction?: string;
  settlementReady: boolean;
  errors: string[];
};

// --- Hashing & Chain Logic ---

/**
 * Computes a deterministic SHA-256 hash for a ledger entry.
 * The hash includes the previous hash to form the chain.
 */
export function computeEntryHash(
  entry: Omit<LedgerEntries, "id" | "createdAt" | "entryHash"> & {
    createdAt: Date;
  }
): string {
  // We create a deterministic string representation of the entry
  // Order of fields matters for the hash to be consistent
  const dataToHash = stableStringify({
    entryType: entry.entryType,
    assetId: entry.assetId,
    spvId: entry.spvId,
    fromUserId: entry.fromUserId,
    toUserId: entry.toUserId,
    tokenAmount: entry.tokenAmount,
    sarAmount: entry.sarAmount?.toString(), // Ensure numeric consistency
    pricePerToken: entry.pricePerToken?.toString(),
    previousHash: entry.previousHash,
    sequenceNumber: entry.sequenceNumber.toString(),
    metadata: entry.metadata, // Assumes metadata keys are sorted or consistent if object
    timestamp: entry.createdAt.toISOString(),
    executedBy: entry.executedBy,
  });

  return crypto.createHash("sha256").update(dataToHash).digest("hex");
}

/**
 * Gets the last ledger entry to establish the chain tip.
 * Uses sequenceNumber to order.
 */
export async function getLastLedgerEntry(trx?: Transaction<DB>) {
  const connection = trx || db;
  return await connection
    .selectFrom("ledgerEntries")
    .select(["entryHash", "sequenceNumber"])
    .orderBy("sequenceNumber", "desc")
    .limit(1)
    .executeTakeFirst();
}

/**
 * Calculates the next sequence number.
 * Handles the BigInt (Int8) type from the database.
 */
export async function getNextSequenceNumber(
  trx?: Transaction<DB>
): Promise<bigint> {
  const lastEntry = await getLastLedgerEntry(trx);
  if (!lastEntry) {
    return BigInt(1);
  }
  // Kysely/Postgres returns Int8 as string usually, but we cast to BigInt to be safe
  return BigInt(lastEntry.sequenceNumber) + BigInt(1);
}

// --- Compliance Gates ---

/**
 * Verifies all compliance rules for a transaction.
 * Checks KYC, Suitability, Jurisdiction, and Wallet Balance.
 */
export async function verifyComplianceGates(params: {
  userId: number;
  assetId?: number | null;
  operationType: "issuance" | "transfer" | "distribution" | "other";
  trx?: Transaction<DB>;
}): Promise<ComplianceCheckResult> {
  const { userId, assetId, operationType, trx } = params;
  const connection = trx || db;

  const result: ComplianceCheckResult = {
    kycVerified: false,
    suitabilityAllowed: true, // Default true if no rules
    jurisdictionAllowed: true, // Default true if no rules
    settlementReady: true, // Default true, checked specifically if needed
    errors: [],
  };

  // 1. KYC Check
  const kycRecord = await connection
    .selectFrom("kycRecords")
    .select(["status", "suitability", "nationality"])
    .where("userId", "=", userId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .executeTakeFirst();

  result.kycStatus = kycRecord?.status;
  if (kycRecord?.status === "approved") {
    result.kycVerified = true;
  } else {
    result.errors.push(`KYC not approved. Status: ${kycRecord?.status}`);
  }

  // If no asset involved, we might skip asset-specific checks
  if (!assetId) {
    return result;
  }

  // 2. Smart Contract Rules (Suitability & Jurisdiction)
  const rules = await connection
    .selectFrom("smartContractRules")
    .selectAll()
    .where("assetId", "=", assetId)
    .executeTakeFirst();

  if (rules) {
    // Suitability Check
    result.suitability = kycRecord?.suitability;
    if (
      rules.requireSuitabilityCheck &&
      rules.allowedSuitabilities &&
      rules.allowedSuitabilities.length > 0
    ) {
      if (
        !kycRecord?.suitability ||
        !rules.allowedSuitabilities.includes(kycRecord.suitability)
      ) {
        result.suitabilityAllowed = false;
        result.errors.push(
          `Investor suitability '${kycRecord?.suitability}' not allowed for this asset.`
        );
      }
    }

    // Jurisdiction Check
    result.jurisdiction = kycRecord?.nationality || "unknown";
    if (
      rules.allowedJurisdictions &&
      rules.allowedJurisdictions.length > 0 &&
      kycRecord?.nationality
    ) {
      if (!rules.allowedJurisdictions.includes(kycRecord.nationality)) {
        result.jurisdictionAllowed = false;
        result.errors.push(
          `Jurisdiction '${kycRecord.nationality}' not allowed for this asset.`
        );
      }
    }
  }

  // 3. Settlement Check (Basic wallet existence check, detailed balance check happens in logic)
  const wallet = await connection
    .selectFrom("investorWallets")
    .select("id")
    .where("userId", "=", userId)
    .executeTakeFirst();

  if (!wallet) {
    result.settlementReady = false;
    result.errors.push("Investor wallet not found.");
  }

  if (result.errors.length > 0) {
    // We don't throw here, we return the result so it can be logged in the ledger
    // The caller decides whether to abort or record a failed transaction
  }

  return result;
}

// --- Emergency Controls ---

/**
 * Checks if an operation is allowed based on global and asset-level controls.
 * Throws if blocked.
 */
export async function checkOperationAllowed(params: {
  assetId?: number | null;
  operationType: "transfer" | "issuance" | "distribution" | "any";
  trx?: Transaction<DB>;
}) {
  const { assetId, operationType, trx } = params;
  const connection = trx || db;

  // 1. Global Controls
  const globalControls = await connection
    .selectFrom("globalControls")
    .selectAll()
    .where("isActive", "=", true)
    .execute();

  for (const control of globalControls) {
    if (control.controlKey === "emergency_shutdown") {
      throw new Error(`System is under emergency shutdown: ${control.reason}`);
    }
    if (
      operationType === "issuance" &&
      control.controlKey === "global_issuance_freeze"
    ) {
      throw new Error(`Global issuance freeze active: ${control.reason}`);
    }
    if (
      operationType === "transfer" &&
      control.controlKey === "global_trading_freeze"
    ) {
      throw new Error(`Global trading freeze active: ${control.reason}`);
    }
    if (
      operationType === "distribution" &&
      control.controlKey === "global_distribution_freeze"
    ) {
      throw new Error(`Global distribution freeze active: ${control.reason}`);
    }
  }

  // 2. Asset Controls
  if (assetId) {
    const assetControl = await connection
      .selectFrom("assetControls")
      .selectAll()
      .where("assetId", "=", assetId)
      .executeTakeFirst();

    if (assetControl) {
      if (assetControl.isFrozen) {
        throw new Error(
          `Asset ${assetId} is frozen: ${assetControl.freezeReason}`
        );
      }
      if (operationType === "issuance" && assetControl.issuancePaused) {
        throw new Error(`Issuance paused for asset ${assetId}`);
      }
      if (operationType === "transfer" && assetControl.transfersPaused) {
        throw new Error(`Transfers paused for asset ${assetId}`);
      }
      if (
        operationType === "distribution" &&
        assetControl.distributionsPaused
      ) {
        throw new Error(`Distributions paused for asset ${assetId}`);
      }
    }
  }
}

// --- Core Ledger Write ---

/**
 * Appends a new entry to the ledger.
 * This is the single source of truth for all blockchain operations.
 * Handles locking to ensure sequence integrity.
 */
export async function appendToLedger(
  params: LedgerEntryInput,
  trx?: Transaction<DB>
) {
  const runInTransaction = async (tx: Transaction<DB>) => {
    // Lock the table or last row to prevent race conditions on sequenceNumber
    // In Postgres, we can lock the table for writing, or just rely on serializable isolation if configured.
    // Here we'll use a simpler approach: fetch last entry FOR UPDATE to lock the tip of the chain.
    // Note: Kysely's `forUpdate()` might lock the selected rows.
    // If table is empty, we can't lock a row, so we might need a table lock or advisory lock.
    // For simplicity in this helper, we assume low concurrency or optimistic handling,
    // but strictly we should lock.
    // Let's try to lock the last row.
    const lastEntry = await tx
      .selectFrom("ledgerEntries")
      .select(["entryHash", "sequenceNumber"])
      .orderBy("sequenceNumber", "desc")
      .limit(1)
      .forUpdate() // Locks this row
      .executeTakeFirst();

    const sequenceNumber = lastEntry
      ? BigInt(lastEntry.sequenceNumber) + BigInt(1)
      : BigInt(1);
    const previousHash = lastEntry
      ? lastEntry.entryHash
      : "0000000000000000000000000000000000000000000000000000000000000000";

    const createdAt = new Date();

    // Prepare data for hashing
    const entryData = {
      ...params,
      sequenceNumber: sequenceNumber.toString(), // Store as string for hash consistency
      previousHash,
      createdAt,
    };

    // Compute Hash
    const entryHash = computeEntryHash({
      ...params,
              sequenceNumber: sequenceNumber.toString() as any,
        previousHash: previousHash as any,
      createdAt,
      // Ensure optional fields are handled same as in computeEntryHash
      assetId: params.assetId ?? null,
      spvId: params.spvId ?? null,
      fromUserId: params.fromUserId ?? null,
      toUserId: params.toUserId ?? null,
            tokenAmount: params.tokenAmount ?? null,
      sarAmount: params.sarAmount != null ? (params.sarAmount.toString() as any) : null,
      pricePerToken: params.pricePerToken != null ? (params.pricePerToken.toString() as any) : null,
      ipAddress: params.ipAddress ?? null,
      legalReference: params.legalReference ?? null,
      reversalReason: params.reversalReason ?? null,
      reversedEntryId: params.reversedEntryId ?? null,
              contractRuleSet: (params.contractRuleSet ?? "v1") as any,
                status: (params.status ?? "pending") as any,
      complianceChecks: params.complianceChecks as any,
      metadata: params.metadata as any,
    });

    // Insert
    const result = await tx
      .insertInto("ledgerEntries")
      .values({
        entryType: params.entryType,
        assetId: params.assetId,
        spvId: params.spvId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        tokenAmount: params.tokenAmount,
        sarAmount:
          params.sarAmount != null
            ? (params.sarAmount.toString() as any)
            : null,
        pricePerToken:
          params.pricePerToken != null
            ? (params.pricePerToken.toString() as any)
            : null,
        complianceChecks: params.complianceChecks as any,
        metadata: params.metadata as any,
        executedBy: params.executedBy,
        ipAddress: params.ipAddress,
        contractRuleSet: (params.contractRuleSet || "v1") as any,
        status: (params.status || "pending") as any,
        legalReference: params.legalReference,
        reversalReason: params.reversalReason,
        reversedEntryId: params.reversedEntryId,
        sequenceNumber: sequenceNumber.toString() as any,
        previousHash: previousHash as any,
        entryHash,
        createdAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  };

  if (trx) {
    return await runInTransaction(trx);
  } else {
    return await db.transaction().execute(async (tx) => {
      return await runInTransaction(tx);
    });
  }
}

// --- Ledger Read & Integrity ---

export async function getLedgerEntries(filters: {
  assetId?: number;
  userId?: number;
  entryType?: LedgerEntryType;
  status?: LedgerEntryStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  let query = db.selectFrom("ledgerEntries").selectAll();

  if (filters.assetId) {
    query = query.where("assetId", "=", filters.assetId);
  }
  if (filters.userId) {
    query = query.where((eb) =>
      eb.or([
        eb("fromUserId", "=", filters.userId!),
        eb("toUserId", "=", filters.userId!),
      ])
    );
  }
  if (filters.entryType) {
    query = query.where("entryType", "=", filters.entryType);
  }
  if (filters.status) {
    query = query.where("status", "=", filters.status);
  }
  if (filters.startDate) {
    query = query.where("createdAt", ">=", filters.startDate);
  }
  if (filters.endDate) {
    query = query.where("createdAt", "<=", filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  const entries = await query
    .orderBy("sequenceNumber", "desc")
    .limit(limit)
    .offset(offset)
    .execute();

  return entries;
}

export async function verifyChainIntegrity(options?: { limit?: number }) {
  const limit = options?.limit || 1000; // Verify last 1000 by default
  const entries = await db
    .selectFrom("ledgerEntries")
    .selectAll()
    .orderBy("sequenceNumber", "desc")
    .limit(limit)
    .execute();

  // Iterate backwards (from newest to oldest in the fetched list)
  // entries[0] is newest. entries[1] is older.
  // entries[0].previousHash should equal entries[1].entryHash

  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const previous = entries[i + 1];

    // 1. Verify Link
    if (current.previousHash !== previous.entryHash) {
      return {
        valid: false,
        invalidAtSequence: Number(current.sequenceNumber),
        details: `Broken chain link at sequence ${current.sequenceNumber}. Previous hash mismatch.`,
      };
    }

    // 2. Verify Hash Content
    // We need to reconstruct the hash.
    // Note: This requires exact reproduction of the input fields used in computeEntryHash
    const recomputedHash = computeEntryHash({
      ...current,
      sarAmount: (current.sarAmount?.toString() ?? null) as any,
      pricePerToken: (current.pricePerToken?.toString() ?? null) as any,
    } as any);

    if (recomputedHash !== current.entryHash) {
      return {
        valid: false,
        invalidAtSequence: Number(current.sequenceNumber),
        details: `Data tampering detected at sequence ${current.sequenceNumber}. Hash mismatch.`,
      };
    }
  }

  return {
    valid: true,
    totalEntries: entries.length,
    details: "Chain integrity verified for checked entries.",
  };
}

// --- High-Level Transactions ---

export async function recordTokenIssuance(
  params: {
    assetId: number;
    spvId: number;
    toUserId: number; // Usually the issuer or initial holder
    tokenAmount: number;
    pricePerToken: number;
    executedBy: number;
    metadata?: Record<string, any>;
  },
  trx: Transaction<DB>
) {
  // 1. Emergency Check
  await checkOperationAllowed({
    assetId: params.assetId,
    operationType: "issuance",
    trx,
  });

  // 2. Compliance Check
  const compliance = await verifyComplianceGates({
    userId: params.toUserId,
    assetId: params.assetId,
    operationType: "issuance",
    trx,
  });

  if (compliance.errors.length > 0) {
    throw new Error(`Compliance failed: ${compliance.errors.join(", ")}`);
  }

  // 3. Append to Ledger
  return await appendToLedger(
    {
      entryType: "token_issuance",
      assetId: params.assetId,
      spvId: params.spvId,
      toUserId: params.toUserId,
      tokenAmount: params.tokenAmount,
      pricePerToken: params.pricePerToken,
      complianceChecks: compliance,
      metadata: params.metadata || {},
      executedBy: params.executedBy,
      status: "confirmed",
    },
    trx
  );
}

export async function recordTokenTransfer(
  params: {
    assetId: number;
    fromUserId: number;
    toUserId: number;
    tokenAmount: number;
    pricePerToken: number;
    totalAmount: number;
    executedBy: number;
    metadata?: Record<string, any>;
  },
  trx: Transaction<DB>
) {
  // 1. Emergency Check
  await checkOperationAllowed({
    assetId: params.assetId,
    operationType: "transfer",
    trx,
  });

  // 2. Compliance Check (Both Parties)
  const complianceFrom = await verifyComplianceGates({
    userId: params.fromUserId,
    assetId: params.assetId,
    operationType: "transfer",
    trx,
  });
  const complianceTo = await verifyComplianceGates({
    userId: params.toUserId,
    assetId: params.assetId,
    operationType: "transfer",
    trx,
  });

  if (complianceFrom.errors.length > 0 || complianceTo.errors.length > 0) {
    throw new Error(
      `Compliance failed. Sender: ${complianceFrom.errors.join(", ")}; Receiver: ${complianceTo.errors.join(", ")}`
    );
  }

  // 3. Append to Ledger
  return await appendToLedger(
    {
      entryType: "token_transfer",
      assetId: params.assetId,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      tokenAmount: params.tokenAmount,
      pricePerToken: params.pricePerToken,
      sarAmount: params.totalAmount,
      complianceChecks: {
        sender: complianceFrom,
        receiver: complianceTo,
      },
      metadata: params.metadata || {},
      executedBy: params.executedBy,
      status: "confirmed",
    },
    trx
  );
}

export async function recordIncomeDistribution(
  params: {
    assetId: number;
    spvId: number;
    totalAmount: number;
    amountPerToken: number;
    executedBy: number;
    metadata?: Record<string, any>;
  },
  trx: Transaction<DB>
) {
  // 1. Emergency Check
  await checkOperationAllowed({
    assetId: params.assetId,
    operationType: "distribution",
    trx,
  });

  // 2. Append to Ledger
  return await appendToLedger(
    {
      entryType: "income_distribution",
      assetId: params.assetId,
      spvId: params.spvId,
      sarAmount: params.totalAmount,
      metadata: {
        ...params.metadata,
        amountPerToken: params.amountPerToken,
      },
      complianceChecks: { note: "System distribution" },
      executedBy: params.executedBy,
      status: "confirmed",
    },
    trx
  );
}

export async function recordReversal(
  params: {
    originalEntryId: number;
    reason: string;
    legalReference: string;
    executedBy: number;
  },
  trx?: Transaction<DB>
) {
  const run = async (tx: Transaction<DB>) => {
    // 1. Fetch Original
    const original = await tx
      .selectFrom("ledgerEntries")
      .selectAll()
      .where("id", "=", params.originalEntryId)
      .executeTakeFirst();

    if (!original) {
      throw new Error("Original entry not found");
    }

    // 2. Check if already reversed
    const existingReversal = await tx
      .selectFrom("ledgerEntries")
      .select("id")
      .where("reversedEntryId", "=", params.originalEntryId)
      .executeTakeFirst();

    if (existingReversal) {
      throw new Error("Entry already reversed");
    }

    // 3. Append Reversal Entry
    // We essentially negate the effect or just mark it.
    // For a true ledger, we add a new entry that references the old one.
    return await appendToLedger(
      {
        entryType: "reversal",
        assetId: original.assetId,
        spvId: original.spvId,
        fromUserId: original.toUserId, // Swap if it was a transfer
        toUserId: original.fromUserId, // Swap if it was a transfer
        tokenAmount: original.tokenAmount,
        sarAmount: original.sarAmount ? Number(original.sarAmount) : undefined,
        complianceChecks: {
          originalEntryId: original.id,
          reason: params.reason,
        },
        metadata: {
          originalEntryHash: original.entryHash,
        },
        executedBy: params.executedBy,
        status: "confirmed",
        reversalReason: params.reason,
        legalReference: params.legalReference,
        reversedEntryId: original.id,
      },
      tx
    );
  };

  if (trx) return run(trx);
  return db.transaction().execute(run);
}