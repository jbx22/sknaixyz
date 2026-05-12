import { schema, OutputType } from "./verify_GET.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { verifyChainIntegrity } from "../../helpers/blockchainLedger";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const rawInput = {
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
    };
    
    const input = schema.parse(rawInput);

    const result = await verifyChainIntegrity({ limit: input.limit });

    return new Response(
      superjson.stringify(result satisfies OutputType)
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