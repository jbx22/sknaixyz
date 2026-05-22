// adapt this to your database schema
import { db } from "../../helpers/db";
import { sql } from "kysely";
import { schema } from "./login_with_password_POST.schema";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";
import { DEMO_PASSWORD, DEMO_USERS, isDemoAccountsEnabled, setDemoCookie, toDemoUser } from "../../helpers/demoServer";

function demoUserResponse(email: string) {
  const user = toDemoUser(email);
  if (!user) return Response.json({ error: "Demo accounts are disabled" }, { status: 403 });
  const response = Response.json({ user });
  setDemoCookie(response, user);
  return response;
}

async function ensureDemoUser(email: string, password: string) {
  const demo = DEMO_USERS[email];
  if (!isDemoAccountsEnabled() || !demo || password !== DEMO_PASSWORD) return;
  const passwordHash = await hash(password, 10);
  const now = new Date();

  const existing = await db
    .selectFrom("users")
    .select(["id"])
    .where("email", "=", email)
    .executeTakeFirst();

  const userId = existing?.id ?? (await db
    .insertInto("users")
    .values({
      email,
      displayName: demo.displayName,
      avatarUrl: null,
      role: demo.role,
      subscriptionTier: demo.subscriptionTier,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()).id;

  await db
    .updateTable("users")
    .set({
      displayName: demo.displayName,
      role: demo.role,
      subscriptionTier: demo.subscriptionTier,
      status: "active",
      updatedAt: now,
    })
    .where("id", "=", userId)
    .execute();

  const existingPassword = await db
    .selectFrom("userPasswords")
    .select("id")
    .where("userId", "=", userId)
    .executeTakeFirst();

  if (existingPassword) {
    await db.updateTable("userPasswords").set({ passwordHash }).where("id", "=", existingPassword.id).execute();
  } else {
    await db.insertInto("userPasswords").values({ userId, passwordHash, createdAt: now }).execute();
  }
}

// Configuration constants
const RATE_LIMIT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 15,
  cleanupProbability: 0.1,
} as const;

// Helper function to safely convert union type to Date
function safeToDate(
  value: string | number | bigint | null | undefined
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    // Convert bigint to number (assuming it's a timestamp in milliseconds)
    return new Date(Number(value));
  }

  return new Date(value);
}

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
    const { email, password } = schema.parse(json);

    // Normalize email to lowercase for consistent handling
    const normalizedEmail = email.toLowerCase();
    if (isDemoAccountsEnabled() && DEMO_USERS[normalizedEmail] && password === DEMO_PASSWORD) {
      return demoUserResponse(normalizedEmail);
    }
    await ensureDemoUser(normalizedEmail, password);
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - RATE_LIMIT_CONFIG.lockoutWindowMinutes * 60 * 1000
    );

    // Start transaction for atomic rate limiting and session creation
    const result = await db.transaction().execute(async (trx) => {
      // Use PostgreSQL advisory lock to serialize access per email
      // This prevents concurrent processing of the same email address
      // The lock is automatically released when the transaction ends
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${normalizedEmail},0))`.execute(
        trx
      );

      // Get rate limiting info efficiently - use COUNT and MAX instead of SELECT *
      const rateLimitQuery = await trx
        .selectFrom("loginAttempts")
        .select([
          trx.fn.countAll<number>().as("failedCount"),
          trx.fn.max(trx.dynamic.ref("attemptedAt")).as("lastFailedAt"),
        ])
        .where("email", "=", normalizedEmail)
        .where("success", "=", false)
        .where("attemptedAt", ">=", windowStart)
        .where("attemptedAt", "is not", null) // Ensure null safety
        .executeTakeFirst();

      const { failedCount = 0, lastFailedAt = null } = rateLimitQuery || {};
      const safeLastFailedAt = safeToDate(lastFailedAt);

      // Check if user is locked out
      if (
        rateLimitQuery &&
        failedCount >= RATE_LIMIT_CONFIG.maxFailedAttempts &&
        safeLastFailedAt
      ) {
        const lockoutEnd = new Date(
          safeLastFailedAt.getTime() +
            RATE_LIMIT_CONFIG.lockoutDurationMinutes * 60 * 1000
        );

        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil(
            (lockoutEnd.getTime() - now.getTime()) / (60 * 1000)
          );
          // DO NOT log blocked attempts to prevent extending lockout indefinitely
          return {
            type: "rate_limited" as const,
            remainingMinutes,
          };
        }
      }

      // Find user by email (normalized)
      const userResults = await trx
        .selectFrom("users")
        .innerJoin("userPasswords", "users.id", "userPasswords.userId")
        .select([
          "users.id",
          "users.email",
          "users.displayName",
          "users.avatarUrl",
          "users.role",
          "users.subscriptionTier",
          "users.status",
          "userPasswords.passwordHash",
        ])
        .where(sql`LOWER(users.email)`, "=", normalizedEmail)
        .limit(1)
        .execute();

      if (userResults.length === 0) {
        // Log failed attempt for non-existent user
        await trx
          .insertInto("loginAttempts")
          .values({
            email: normalizedEmail,
            attemptedAt: now,
            success: false,
          })
          .execute();

        return {
          type: "auth_failed" as const,
        };
      }

      const user = userResults[0];

      // Check user status before verifying password
      if (user.status === "suspended") {
        return {
          type: "account_suspended" as const,
        };
      }

      if (user.status === "deactivated") {
        return {
          type: "account_deactivated" as const,
        };
      }

      // Verify password
      const passwordValid = await compare(password, user.passwordHash);
      if (!passwordValid) {
        // Log failed attempt for invalid password
        await trx
          .insertInto("loginAttempts")
          .values({
            email: normalizedEmail,
            attemptedAt: now,
            success: false,
          })
          .execute();

        return {
          type: "auth_failed" as const,
        };
      }

      // Password is valid - log successful attempt
      await trx
        .insertInto("loginAttempts")
        .values({
          email: normalizedEmail,
          attemptedAt: now,
          success: true,
        })
        .execute();

      // Create session inside the same transaction to ensure atomicity
      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = new Date(
        now.getTime() + SessionExpirationSeconds * 1000
      );

      await trx
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: user.id,
          createdAt: now,
          lastAccessed: now,
          expiresAt: expiresAt,
          sessionType: "auth",
        })
        .execute();

      // Reset failed attempts counter by deleting previous failed attempts
      // This preserves audit trail of successful logins
      await trx
        .deleteFrom("loginAttempts")
        .where("email", "=", normalizedEmail)
        .where("success", "=", false)
        .execute();

      return {
        type: "success" as const,
        user,
        sessionId,
        sessionCreatedAt: now,
      };
    });

    // Clean up old login attempts periodically
    // Run cleanup outside transaction to prevent extending transaction time and potential deadlocks
    if (Math.random() < RATE_LIMIT_CONFIG.cleanupProbability) {
      const cleanupBefore = new Date(
        now.getTime() - RATE_LIMIT_CONFIG.lockoutWindowMinutes * 60 * 1000
      );
      try {
        const deleteResult = await db
          .deleteFrom("loginAttempts")
          .where("attemptedAt", "<", cleanupBefore)
          .where("attemptedAt", "is not", null)
          .executeTakeFirst();
      } catch {
        // Don't fail the login if cleanup fails
      }
    }

    // Handle different transaction results
    if (result.type === "rate_limited") {
      // Add constant delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500));
      return Response.json(
        {
          message: `Too many failed login attempts. Account locked for ${result.remainingMinutes} more minutes.`,
        },
        { status: 429 }
      );
    }

    if (result.type === "auth_failed") {
      // Add constant delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500));
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (result.type === "account_suspended") {
      return Response.json(
        { message: "Your account has been suspended. Please contact support. | تم توقيف حسابك. يرجى التواصل مع الدعم." },
        { status: 403 }
      );
    }

    if (result.type === "account_deactivated") {
      return Response.json(
        { message: "Your account has been deactivated. | تم تعطيل حسابك." },
        { status: 403 }
      );
    }

    // Success case - session was already created in transaction
    const user = result.user;

    // Create response with user data (excluding sensitive information)
    const userData: User = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };

    const response = Response.json({
      user: userData,
    });

    // Set session cookie
    await setServerSession(response, {
      id: result.sessionId,
      createdAt: result.sessionCreatedAt.getTime(),
      lastAccessed: result.sessionCreatedAt.getTime(),
    });

    return response;
  } catch (error) {
    return Response.json({
      message: "Authentication failed",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}
