import { DatabaseRole } from "@/types/user";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/**
 * AuthResponse from backend API
 * Contains database role (owner/customer) which will be mapped to application role
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: DatabaseRole; // Database role: "owner" | "customer"
  };
  token?: string;
}
