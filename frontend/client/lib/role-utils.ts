import { DB_ROLES, ROLES } from "./constants";

/**
 * Database role type (stored in database)
 */
export type DatabaseRole = (typeof DB_ROLES)[keyof typeof DB_ROLES];

/**
 * Application role type (used in frontend)
 */
export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Maps database role to application role
 * - owner (database) → ADMIN (application)
 * - customer (database) → USER (application)
 * - no session → GUEST (handled separately)
 */
export function mapDatabaseRoleToAppRole(dbRole: DatabaseRole): AppRole {
  switch (dbRole) {
    case DB_ROLES.OWNER:
      return ROLES.ADMIN;
    case DB_ROLES.CUSTOMER:
      return ROLES.USER;
    default:
      // Fallback to USER for unknown roles
      return ROLES.USER;
  }
}

/**
 * Checks if a database role is owner
 */
export function isOwnerRole(role: string): boolean {
  return role === DB_ROLES.OWNER;
}

/**
 * Checks if a database role is customer
 */
export function isCustomerRole(role: string): boolean {
  return role === DB_ROLES.CUSTOMER;
}
