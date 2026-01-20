import { ROLES, DB_ROLES } from "@/lib/constants";

/**
 * Application role type (used in frontend logic)
 * - GUEST: not logged in
 * - USER: logged in as customer
 * - ADMIN: logged in as owner
 */
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Database role type (stored in database)
 * - owner: store owner
 * - customer: regular customer
 */
export type DatabaseRole = (typeof DB_ROLES)[keyof typeof DB_ROLES];

/**
 * User from database (contains database role)
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: DatabaseRole; // Database role: "owner" | "customer"
  status: "active" | "inactive" | "suspended";
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User in session (contains application role)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole; // Application role: "GUEST" | "USER" | "ADMIN"
}
