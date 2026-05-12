import { schema, OutputType } from "./freeze_POST.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { freezeAsset, unfreezeAsset, setGlobalControl } from "../../../helpers/emergencyControls";
import { logAdminActivity } from "../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden: Superadmin only" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let resultControl: any;

    if (input.scope === "asset") {
      if (!input.assetId) throw new Error("Asset ID required for asset scope");
      
      if (input.action === "freeze") {
        resultControl = await freezeAsset({
          assetId: input.assetId,
          reason: input.reason,
          frozenBy: session.user.id,
          type: input.type,
        });
      } else {
        resultControl = await unfreezeAsset({
          assetId: input.assetId,
          unfrozenBy: session.user.id,
          type: input.type,
        });
      }
    } else {
      // Global scope
      if (!input.controlKey) throw new Error("Control Key required for global scope");
      
      resultControl = await setGlobalControl({
        controlKey: input.controlKey,
        isActive: input.action === "freeze",
        activatedBy: session.user.id,
        reason: input.reason,
      });
    }

    await logAdminActivity({
      adminId: session.user.id,
      actionType: input.action === "freeze" ? "EMERGENCY_FREEZE" : "EMERGENCY_UNFREEZE",
      targetType: input.scope === "asset" ? "ASSET" : "GLOBAL_CONTROL",
            targetId: input.scope === "asset" ? (input.assetId ?? null) : null,
      details: {
        scope: input.scope,
        controlKey: input.controlKey,
        type: input.type,
        reason: input.reason,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(
      superjson.stringify({
        control: resultControl,
        message: `Successfully ${input.action}d ${input.scope} controls`,
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