import { DatabaseRole } from "@/types/user";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/** POST /auth/register/start */
export interface RegisterStartResult {
  registrationSessionId: string;
}

/** Backend `ServiceResponse` envelope */
export interface ServiceResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null | undefined;
  statusCode: number;
}

/** Matches backend `TokenResponse` (login / register / refresh) */
export interface TokenResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: DatabaseRole;
  };
}

/**
 * Normalized auth result for NextAuth `authorize` and client flows.
 * `user.role` here is the database role; map to app role at the session layer.
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: DatabaseRole;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
