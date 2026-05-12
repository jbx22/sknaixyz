import { User } from "./User";
import { SessionExpirationSeconds } from "./getSetServerSession";

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
export const DEMO_PASSWORD = "demo123";

export const DEMO_USERS: Record<string, { id: number; displayName: string; role: "user" | "admin" | "superadmin"; subscriptionTier: "free" | "basic" | "premium" }> = {
  "demo@sknai": { id: 9000, displayName: "SKNAI Demo User", role: "user", subscriptionTier: "premium" },
  "demo.investor@sknai.test": { id: 9001, displayName: "Demo Investor", role: "user", subscriptionTier: "premium" },
  "demo.owner@sknai.test": { id: 9002, displayName: "Demo Property Owner", role: "user", subscriptionTier: "premium" },
  "demo.broker@sknai.test": { id: 9003, displayName: "Demo Broker Office", role: "user", subscriptionTier: "premium" },
  "demo.developer@sknai.test": { id: 9004, displayName: "Demo Developer", role: "user", subscriptionTier: "premium" },
  "demo.admin@sknai.test": { id: 9005, displayName: "Demo Admin", role: "admin", subscriptionTier: "premium" },
  "demo.superadmin@sknai.test": { id: 9006, displayName: "Demo Super Admin", role: "superadmin", subscriptionTier: "premium" },
};

export function isDemoAccountsEnabled() {
  if (process.env.SKNAI_ALLOW_DEMO_IN_PRODUCTION === "true") return true;
  return process.env.ENABLE_DEMO_ACCOUNTS === "true" && !isProduction;
}

export function toDemoUser(email: string): User | null {
  if (!isDemoAccountsEnabled()) return null;
  const demo = DEMO_USERS[email.toLowerCase()];
  if (!demo) return null;
  return { id: demo.id, email: email.toLowerCase(), displayName: demo.displayName, avatarUrl: null, role: demo.role, subscriptionTier: demo.subscriptionTier };
}

export function setDemoCookie(response: Response, user: User) {
  const parts = [
    `sknai_demo_user=${Buffer.from(JSON.stringify(user)).toString("base64url")}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SessionExpirationSeconds}`,
    "Priority=Low",
  ];
  if (isProduction) parts.push("Secure");
  response.headers.set("Set-Cookie", parts.join("; "));
}

export function clearDemoCookie(response: Response) {
  const parts = ["sknai_demo_user=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0", "Priority=Low"];
  if (isProduction) parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

export function getDemoUserFromCookie(request: Request): User | null {
  if (!isDemoAccountsEnabled()) return null;
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    const value = rest.join("=");
    if (name && value) acc[name] = decodeURIComponent(value);
    return acc;
  }, {});
  const encoded = cookies.sknai_demo_user;
  if (!encoded) return null;
  try {
    const user = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!user?.email || !user?.role) return null;
    return user satisfies User;
  } catch {
    return null;
  }
}
