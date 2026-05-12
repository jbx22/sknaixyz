// adapt this to the database schema and helpers if necessary
import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import {
  isEmailDomainValid,
  EMAIL_DOMAIN_ERROR_MESSAGE,
} from "../../helpers/emailDomainValidator";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      // 1MB limit
      return Response.json(
        { message: "Request payload too large" },
        { status: 413 }
      );
    }
    const json = JSON.parse(body);
    const { email, password, displayName } = schema.parse(json);

    // Secondary server-side check for email domain validation
    if (!isEmailDomainValid(email)) {
      return Response.json(
        { message: EMAIL_DOMAIN_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      return Response.json(
        { message: "email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await generatePasswordHash(password);

    // Create new user
    const newUser = await db.transaction().execute(async (trx) => {
      // Insert the user
      const [user] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          role: "user", // Default role
        })
        .returning(["id", "email", "displayName", "createdAt", "subscriptionTier"])
        .execute();

      // Store the password hash in another table
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      return user;
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: newUser.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
        sessionType: "auth",
      })
      .execute();

    // Create response with user data
    const response = Response.json({
      user: {
        ...newUser,
        role: "user" as const,
        subscriptionTier: newUser.subscriptionTier,
      },
    });

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return Response.json({ message: errorMessage }, { status: 400 });
  }
}
