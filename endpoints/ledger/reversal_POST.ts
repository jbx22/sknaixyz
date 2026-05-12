import { schema, OutputType } from "./reversal_POST.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { recordReversal } from "../../helpers/blockchainLedger";
import { logAdminActivity } from "../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden: Superadmin only" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const entry = await recordReversal({
      originalEntryId: input.originalEntryId,
      reason: input.reason,
      legalReference: input.legalReference,
      executedBy: session.user.id,
    });

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "LEDGER_REVERSAL",
      targetType: "LEDGER_ENTRY",
      targetId: input.originalEntryId,
      details: {
        reason: input.reason,
        legalReference: input.legalReference,
        reversalEntryId: entry.id,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(
      superjson.stringify({
        entry,
        message: "Ledger entry reversed successfully",
      } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}