import { schema, OutputType } from "./submit_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check existing KYC
    const existingKyc = await db
      .selectFrom("kycRecords")
      .where("userId", "=", userId)
      .select(["status"])
      .executeTakeFirst();

    if (existingKyc?.status === "approved") {
      return new Response(
        superjson.stringify({ error: "KYC is already approved" }),
        { status: 400 }
      );
    }

    // Use a transaction to ensure both KYC record update and compliance log are created
    const result = await db.transaction().execute(async (trx) => {
      // Upsert KYC record
      // Note: Postgres 'ON CONFLICT' handles the upsert.
      // We reset status to 'pending' and clear rejection reason on resubmission.
      const kycRecord = await trx
        .insertInto("kycRecords")
        .values({
          userId,
          fullNameAr: input.fullNameAr,
          fullNameEn: input.fullNameEn,
          nationalId: input.nationalId,
          nationality: input.nationality,
          dateOfBirth: input.dateOfBirth,
          phone: input.phone,
          address: input.address,
          status: "pending",
          rejectionReason: null,
          updatedAt: new Date(),
          // Default suitability, can be updated by admin later
          suitability: "retail",
        })
        .onConflict((oc) =>
          oc.column("userId").doUpdateSet({
            fullNameAr: input.fullNameAr,
            fullNameEn: input.fullNameEn,
            nationalId: input.nationalId,
            nationality: input.nationality,
            dateOfBirth: input.dateOfBirth,
            phone: input.phone,
            address: input.address,
            status: "pending",
            rejectionReason: null,
            updatedAt: new Date(),
          })
        )
        .returningAll()
        .executeTakeFirstOrThrow();

      // Log to compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "kyc_submit",
          entityType: "kyc",
          entityId: kycRecord.id,
          userId: userId,
          details: JSON.stringify({
            previousStatus: existingKyc?.status || "none",
            submittedAt: new Date().toISOString(),
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();

      return kycRecord;
    });

    const response: OutputType = {
      kyc: result,
      message: "KYC application submitted successfully",
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to submit KYC" }),
        { status: 401 }
      );
    }

    console.error("KYC submit error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to submit KYC",
      }),
      { status: 400 }
    );
  }
}