import { db } from "./db";
import { ControlKeyType } from "./schema";
import { appendToLedger } from "./blockchainLedger";

// --- Asset Controls ---

export async function freezeAsset(params: {
  assetId: number;
  reason: string;
  frozenBy: number;
  type?: "full" | "transfers" | "issuance" | "distributions";
}) {
  const { assetId, reason, frozenBy, type = "full" } = params;

  return await db.transaction().execute(async (trx) => {
    // 1. Update Asset Controls Table
    // We use an upsert-like logic: check if exists, then update or insert
    const existing = await trx
      .selectFrom("assetControls")
      .select("id")
      .where("assetId", "=", assetId)
      .executeTakeFirst();

    let updateData: any = {
      freezeReason: reason,
      frozenBy: frozenBy,
      frozenAt: new Date(),
      updatedAt: new Date(),
    };

    if (type === "full") updateData.isFrozen = true;
    if (type === "transfers") updateData.transfersPaused = true;
    if (type === "issuance") updateData.issuancePaused = true;
    if (type === "distributions") updateData.distributionsPaused = true;

    let result;
    if (existing) {
      result = await trx
        .updateTable("assetControls")
        .set(updateData)
        .where("assetId", "=", assetId)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      result = await trx
        .insertInto("assetControls")
        .values({
          assetId,
          isFrozen: type === "full",
          transfersPaused: type === "transfers",
          issuancePaused: type === "issuance",
          distributionsPaused: type === "distributions",
          freezeReason: reason,
          frozenBy,
          frozenAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          regulatoryHold: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // 2. Log to Ledger
    await appendToLedger(
      {
        entryType: "asset_freeze",
        assetId,
        executedBy: frozenBy,
        complianceChecks: { type, reason },
        metadata: {
          controlType: type,
          action: "freeze",
        },
        status: "confirmed",
      },
      trx
    );

    return result;
  });
}

export async function unfreezeAsset(params: {
  assetId: number;
  unfrozenBy: number;
  type?: "full" | "transfers" | "issuance" | "distributions";
}) {
  const { assetId, unfrozenBy, type = "full" } = params;

  return await db.transaction().execute(async (trx) => {
    let updateData: any = {
      updatedAt: new Date(),
      // If unfreezing full, we might want to clear the reason?
      // Or keep it for history. Let's keep it but clear the flag.
    };

    if (type === "full") {
      updateData.isFrozen = false;
      updateData.freezeReason = null; // Clear reason on full unfreeze
    }
    if (type === "transfers") updateData.transfersPaused = false;
    if (type === "issuance") updateData.issuancePaused = false;
    if (type === "distributions") updateData.distributionsPaused = false;

    const result = await trx
      .updateTable("assetControls")
      .set(updateData)
      .where("assetId", "=", assetId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Log to Ledger
    await appendToLedger(
      {
        entryType: "asset_unfreeze",
        assetId,
        executedBy: unfrozenBy,
        complianceChecks: { type },
        metadata: {
          controlType: type,
          action: "unfreeze",
        },
        status: "confirmed",
      },
      trx
    );

    return result;
  });
}

export async function getAssetControls(assetId: number) {
  return await db
    .selectFrom("assetControls")
    .selectAll()
    .where("assetId", "=", assetId)
    .executeTakeFirst();
}

// --- Global Controls ---

export async function setGlobalControl(params: {
  controlKey: ControlKeyType;
  isActive: boolean;
  activatedBy: number;
  reason: string;
}) {
  const { controlKey, isActive, activatedBy, reason } = params;

  return await db.transaction().execute(async (trx) => {
    // 1. Update Global Controls
    // Check if exists
    const existing = await trx
      .selectFrom("globalControls")
      .select("id")
      .where("controlKey", "=", controlKey)
      .executeTakeFirst();

    let result;
    if (existing) {
      result = await trx
        .updateTable("globalControls")
        .set({
          isActive,
          reason,
          activatedBy,
          activatedAt: isActive ? new Date() : null,
          updatedAt: new Date(),
        })
        .where("controlKey", "=", controlKey)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      result = await trx
        .insertInto("globalControls")
        .values({
          controlKey,
          isActive,
          reason,
          activatedBy,
          activatedAt: isActive ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // 2. Log to Ledger
    await appendToLedger(
      {
        entryType: isActive ? "global_freeze" : "global_unfreeze",
        executedBy: activatedBy,
        complianceChecks: { controlKey, reason },
        metadata: {
          controlKey,
          isActive,
        },
        status: "confirmed",
      },
      trx
    );

    return result;
  });
}

export async function getGlobalControls() {
  return await db.selectFrom("globalControls").selectAll().execute();
}

export async function isSystemOperational() {
  const shutdown = await db
    .selectFrom("globalControls")
    .select("isActive")
    .where("controlKey", "=", "emergency_shutdown")
    .executeTakeFirst();

  return !shutdown?.isActive;
}

// --- Smart Contract Rules ---

export async function getContractRules(assetId: number) {
  return await db
    .selectFrom("smartContractRules")
    .selectAll()
    .where("assetId", "=", assetId)
    .executeTakeFirst();
}

export async function upsertContractRules(params: {
  assetId: number;
  createdBy: number;
  minInvestmentSar: number;
  maxInvestmentSar?: number | null;
  maxInvestors?: number | null;
  maxTokenSupply: number;
  requireKyc: boolean;
  requireSuitabilityCheck: boolean;
  allowedSuitabilities: string[];
  allowedJurisdictions: string[];
  minHoldingPeriodDays: number;
}) {
  const { assetId, createdBy, ...rules } = params;

  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("smartContractRules")
      .select("id")
      .where("assetId", "=", assetId)
      .executeTakeFirst();

    if (existing) {
      return await trx
        .updateTable("smartContractRules")
        .set({
          ...rules,
          minInvestmentSar: rules.minInvestmentSar.toString(),
          maxInvestmentSar: rules.maxInvestmentSar?.toString(),
          updatedAt: new Date(),
        })
        .where("assetId", "=", assetId)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      return await trx
        .insertInto("smartContractRules")
        .values({
          assetId,
          createdBy,
          ...rules,
          minInvestmentSar: rules.minInvestmentSar.toString(),
          maxInvestmentSar: rules.maxInvestmentSar?.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ruleVersion: "v1",
          autoDistribute: false,
          canForceTransfer: true,
          canFreezeIndividualHoldings: true,
          distributionFrequency: "quarterly",
          requireSettlementConfirmation: true,
          tokensReserved: 0,
          withholdingTaxRate: "0",
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }
  });
}