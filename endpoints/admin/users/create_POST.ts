import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../helpers/logAdminActivity";
import { generatePasswordHash } from "../../../helpers/generatePasswordHash";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    
    // Strict Superadmin check
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden: Superadmin access required" }), { status: 403 });
    }

    const body = await request.text();
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Check for duplicate email
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", input.email)
      .executeTakeFirst();

    if (existingUser) {
      return new Response(superjson.stringify({ error: "Email already exists" }), { status: 409 });
    }

    // Hash password
    const passwordHash = await generatePasswordHash(input.password);

    // Transaction to create user and password
    const newUser = await db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto("users")
        .values({
          email: input.email,
          displayName: input.displayName,
          role: input.role,
          subscriptionTier: input.subscriptionTier,
          status: "active",
          emailVerified: true, // Admin created users are verified by default
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(["id", "email", "displayName", "role", "subscriptionTier", "createdAt"])
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash: passwordHash,
          createdAt: new Date(),
        })
        .execute();

      return user;
    });

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "CREATE_USER",
      targetType: "USER",
      targetId: newUser.id,
      details: {
        email: newUser.email,
        role: newUser.role,
        createdBy: session.user.email
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ success: true, user: newUser } satisfies OutputType));

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