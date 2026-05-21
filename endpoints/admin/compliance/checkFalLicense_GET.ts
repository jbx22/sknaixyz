import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { validateFalLicense } from "../../../helpers/regaApi";
import { ndmoMaskLogDetails } from "../../../helpers/ndmoCrypto";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const licenseNumber = url.searchParams.get("licenseNumber");

    if (!licenseNumber?.trim()) {
      return new Response(superjson.stringify({ error: "licenseNumber query parameter is required" }), { status: 400 });
    }

    const result = await validateFalLicense(licenseNumber.trim());

    return new Response(superjson.stringify(result), {
      status: result.isValid ? 200 : 200, // Always 200, isValid in payload
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
