import { OutputType } from "./status_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const kycRecord = await db
      .selectFrom("kycRecords")
      .where("userId", "=", userId)
      .selectAll()
      .executeTakeFirst();

    const response: OutputType = {
      kyc: kycRecord || null,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view KYC status" }),
        { status: 401 }
      );
    }

    console.error("KYC status error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch KYC status",
      }),
      { status: 400 }
    );
  }
}