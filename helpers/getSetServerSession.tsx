import { jwtVerify, SignJWT } from "jose";
import { db } from "./db";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short. Use a random value of at least 32 characters.");
  }
  return encoder.encode(secret);
}

export const SessionExpirationSeconds = 60 * 60 * 24 * 7; // 1 week
export const CleanupProbability = 0.1;

export interface Session {
  id: string;
  createdAt: number;
  lastAccessed: number;
  passwordChangeRequired?: boolean;
}

const CookieName = "sknai_session";
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export class NotAuthenticatedError extends Error {
  constructor(message?: string) {
    super(message ?? "Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

export async function getServerSessionOrThrow(request: Request): Promise<Session> {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").reduce((cookies: Record<string, string>, cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    const value = rest.join("=");
    if (name && value) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
  const sessionCookie = cookies[CookieName];

  if (!sessionCookie) throw new NotAuthenticatedError();

  try {
    const { payload } = await jwtVerify(sessionCookie, getJwtSecret());
    const sessionId = payload.id as string;

    const session = await db
      .selectFrom("sessions")
      .select(["id", "userId", "expiresAt"])
      .where("id", "=", sessionId)
      .executeTakeFirst();

    if (!session) throw new NotAuthenticatedError("Session not found");

    const now = new Date();
    if (session.expiresAt < now) throw new NotAuthenticatedError("Session expired");

    return {
      id: payload.id as string,
      createdAt: payload.createdAt as number,
      lastAccessed: payload.lastAccessed as number,
      passwordChangeRequired: payload.passwordChangeRequired as boolean,
    };
  } catch {
    throw new NotAuthenticatedError();
  }
}

export async function setServerSession(response: Response, session: Session): Promise<void> {
  const token = await new SignJWT({
    id: session.id,
    createdAt: session.createdAt,
    lastAccessed: session.lastAccessed,
    passwordChangeRequired: session.passwordChangeRequired,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  const cookieParts = [
    `${CookieName}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SessionExpirationSeconds}`,
    "Priority=High",
  ];
  if (isProduction) cookieParts.push("Secure");

  response.headers.set("Set-Cookie", cookieParts.join("; "));
}

export function clearServerSession(response: Response) {
  const cookieParts = [
    `${CookieName}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
    "Priority=High",
  ];
  if (isProduction) cookieParts.push("Secure");

  response.headers.set("Set-Cookie", cookieParts.join("; "));
}
