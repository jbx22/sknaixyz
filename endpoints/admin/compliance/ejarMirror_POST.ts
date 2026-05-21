import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { mirrorPaymentToEjar, logComplianceEvent } from "../../../helpers/regaApi";

export const schema = {
  type: "object",
  required: ["contractId", "paymentMethod"],
  properties: {
    contractId: { type: "number" },
    paymentMethod: { type: "string", enum: ["SADAD", "MADA", "BANK_TRANSFER", "CASH"] },
    amountSar: { type: "number" },
  },
};

export type InputType = {
  contractId: number;
  paymentMethod: "SADAD" | "MADA" | "BANK_TRANSFER" | "CASH";
  amountSar?: number;
};

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.json();
    const { contractId, paymentMethod, amountSar } = body as InputType;

    if (!contractId || !paymentMethod) {
      return new Response(superjson.stringify({ error: "contractId and paymentMethod are required" }), { status: 400 });
    }

    // Fetch the contract to get Ejar number and details
    const contract = await db
      .selectFrom("rentalContracts")
      .where("id", "=", contractId)
      .select([
        "id",
        "ejarContractNumber",
        "monthlyRent",
        "tenantUserId",
        "propertyId",
      ])
      .executeTakeFirst();

    if (!contract) {
      return new Response(superjson.stringify({ error: "Contract not found" }), { status: 404 });
    }

    if (!contract.ejarContractNumber) {
      return new Response(
        superjson.stringify({ error: "Contract has no Ejar number. Link to Ejar first." }),
        { status: 400 }
      );
    }

    const amount = amountSar || Number(contract.monthlyRent);

    // Mirror to Ejar
    const result = await mirrorPaymentToEjar({
      integrationPartner: "SKNAI_PropTech",
      ejarContractNumber: contract.ejarContractNumber,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      paymentMethod,
      amountSar: amount,
      paymentTimestamp: new Date().toISOString(),
    });

    // Log compliance event
    await logComplianceEvent(
      contractId,
      "ejar_payment_settled",
      `تم تسوية دفعة ${amount} ريال للعقد ${contract.ejarContractNumber} عبر ${paymentMethod}`,
      {
        ejarContractNumber: contract.ejarContractNumber,
        amount,
        paymentMethod,
        ejarReference: result.ejarReference,
      }
    );

    return new Response(superjson.stringify(result), {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
}
