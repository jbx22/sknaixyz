import { schema, OutputType } from "./asset-controls_GET.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getAssetControls } from "../../helpers/emergencyControls";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const rawInput = {
      assetId: queryParams.assetId ? Number(queryParams.assetId) : undefined,
    };
    
    const input = schema.parse(rawInput);

    const controls = await getAssetControls(input.assetId);

    return new Response(
      superjson.stringify({
        controls: controls || null,
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