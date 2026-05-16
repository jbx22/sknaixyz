import { db } from "./db";
import type { UserRole } from "./schema";

/**
 * Property-level access control for SKNAI rent management.
 * 
 * Role hierarchy:
 * - superadmin: full access to everything
 * - admin: full access to everything
 * - owner: manages their own properties' rentals
 * - developer: manages their developments' rentals
 * - broker: manages assigned properties' rentals
 * - investor: views rental income from fractional shares
 * - user/buyer: can browse rentals, apply as tenant, view own leases
 */

export type PropertyMemberRole = "owner" | "developer" | "broker" | "investor" | "tenant";

export interface PropertyAccess {
  canManage: boolean;       // Can CRUD contracts, invoices, payments, expenses
  canViewReports: boolean;  // Can see financial reports
  canListUnits: boolean;    // Can create/edit units
  canApproveTenants: boolean; // Can approve/reject rental applications
  propertyIds: number[];    // Properties this user has access to
  role: string;
}

/**
 * Check if a user has platform-level admin access.
 */
export function isPlatformAdmin(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Check if a user has property management rights (owner, developer, broker).
 */
export function isPropertyManager(role: UserRole): boolean {
  return isPlatformAdmin(role) || role === "owner" || role === "developer" || role === "broker";
}

/**
 * Get all property IDs a user can manage (as owner, developer, or broker).
 */
export async function getManagedPropertyIds(userId: number, userRole: UserRole): Promise<number[]> {
  if (isPlatformAdmin(userRole)) {
    // Admins see all properties
    const props = await db.selectFrom("properties").select(["id"]).execute();
    return props.map(p => p.id);
  }

  // Properties where user is creator
  const owned = await db.selectFrom("properties")
    .where("userId", "=", userId)
    .select(["id"])
    .execute();

  // Properties where user is a member (owner, developer, broker)
  const memberOf = await db.selectFrom("propertyMembers")
    .where("userId", "=", userId)
    .where("role", "in", ["owner", "developer", "broker"])
    .select(["propertyId"])
    .execute();

  const ids = new Set<number>();
  owned.forEach(p => ids.add(p.id));
  memberOf.forEach(p => ids.add(p.propertyId));
  return Array.from(ids);
}

/**
 * Get full property access profile for a user.
 */
export async function getPropertyAccess(userId: number, userRole: UserRole): Promise<PropertyAccess> {
  if (isPlatformAdmin(userRole)) {
    const props = await db.selectFrom("properties").select(["id"]).execute();
    return {
      canManage: true,
      canViewReports: true,
      canListUnits: true,
      canApproveTenants: true,
      propertyIds: props.map(p => p.id),
      role: userRole,
    };
  }

  const managedIds = await getManagedPropertyIds(userId, userRole);
  const isManager = managedIds.length > 0 || userRole === "owner" || userRole === "developer" || userRole === "broker";

  return {
    canManage: isManager,
    canViewReports: isManager || userRole === "user", // investors can also view
    canListUnits: isManager,
    canApproveTenants: isManager,
    propertyIds: managedIds,
    role: userRole,
  };
}

/**
 * Check if a user can access a specific property for rent management.
 */
export async function canAccessProperty(userId: number, userRole: UserRole, propertyId: number): Promise<boolean> {
  if (isPlatformAdmin(userRole)) return true;

  // Check if user created the property
  const owned = await db.selectFrom("properties")
    .where("id", "=", propertyId)
    .where("userId", "=", userId)
    .select(["id"])
    .executeTakeFirst();
  if (owned) return true;

  // Check if user is a member of the property
  const member = await db.selectFrom("propertyMembers")
    .where("userId", "=", userId)
    .where("propertyId", "=", propertyId)
    .where("role", "in", ["owner", "developer", "broker"])
    .select(["id"])
    .executeTakeFirst();
  if (member) return true;

  return false;
}

/**
 * Check if a user can act as a tenant (any authenticated user can).
 */
export function canBeTenant(userRole: UserRole): boolean {
  return true; // All authenticated users can rent
}

/**
 * Get investor property IDs (fractional ownership).
 */
export async function getInvestorPropertyIds(userId: number): Promise<number[]> {
  const shares = await db.selectFrom("propertyOwnershipShares")
    .where("userId", "=", userId)
    .select(["propertyId"])
    .execute();
  return shares.map(s => s.propertyId);
}
