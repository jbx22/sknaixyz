import { schema, OutputType } from "./contract-rules_POST.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { upsertContractRules } from "../../helpers/emergencyControls";
import { logAdminActivity } from "../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const rules = await upsertContractRules({
      ...input,
      createdBy: session.user.id,
    });

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "UPDATE_CONTRACT_RULES",
      targetType: "ASSET",
      targetId: input.assetId,
      details: {
        assetId: input.assetId,
        rules: input,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(
      superjson.stringify({
        rules,
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