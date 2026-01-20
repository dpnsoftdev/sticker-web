import { auth } from "@/auth";
import { ROLES } from "@/lib/constants";

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== ROLES.ADMIN) {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

/**
 * Get current user session (nullable)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
