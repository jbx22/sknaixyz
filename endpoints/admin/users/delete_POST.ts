import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      // 1MB limit
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Prevent deleting self
    if (input.userId === session.user.id) {
      return new Response(superjson.stringify({ error: "Cannot delete your own account" }), { status: 400 });
    }

    // Check if user exists
    const existingUser = await db
      .selectFrom("users")
      .select(["email", "role"])
      .where("id", "=", input.userId)
      .executeTakeFirst();

    if (!existingUser) {
      return new Response(superjson.stringify({ error: "User not found" }), { status: 404 });
    }

    // Permission guard: Nobody can delete a superadmin account via API
    if (existingUser.role === "superadmin") {
      return new Response(
        superjson.stringify({ error: "Cannot delete superadmin accounts" }),
        { status: 403 }
      );
    }

    // Perform cascade delete in a transaction
    await db.transaction().execute(async (trx) => {
      // Delete related data
      await trx.deleteFrom("sessions").where("userId", "=", input.userId).execute();
      await trx.deleteFrom("userFavorites").where("userId", "=", input.userId).execute();
      await trx.deleteFrom("propertyChats").where("userId", "=", input.userId).execute();
      await trx.deleteFrom("subscriptionPayments").where("userId", "=", input.userId).execute();
      await trx.deleteFrom("oauthAccounts").where("userId", "=", input.userId).execute();
      await trx.deleteFrom("userPasswords").where("userId", "=", input.userId).execute();
      
      // Delete properties (and their related data if needed, though properties table usually cascades or we keep them but mark as deleted/archived. 
      // Here we delete them for simplicity as per request "Cascade delete all related data")
      // Note: If properties have other relations like favorites from OTHER users, we need to handle that.
      // For now, let's assume simple deletion.
      
      // First delete favorites ON user's properties
      await trx.deleteFrom("userFavorites")
        .where("propertyId", "in", 
          trx.selectFrom("properties").select("id").where("userId", "=", input.userId)
        )
        .execute();

      // Delete chats ON user's properties
      await trx.deleteFrom("propertyChats")
        .where("propertyId", "in", 
          trx.selectFrom("properties").select("id").where("userId", "=", input.userId)
        )
        .execute();

      await trx.deleteFrom("properties").where("userId", "=", input.userId).execute();
      
      // Finally delete user
      await trx.deleteFrom("users").where("id", "=", input.userId).execute();
    });

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "DELETE_USER",
      targetType: "USER",
      targetId: input.userId,
      details: {
        deletedUserEmail: existingUser.email,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}