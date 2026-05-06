import { DefaultSession } from "next-auth";
import { SessionUser } from "./user";

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
    /** Backend JWT access token — attach to API requests via Authorization: Bearer */
    accessToken: string;
    /** Backend refresh JWT — POST /auth/refresh (stored in encrypted JWT cookie only). */
    refreshToken: string;
  }

  interface User extends SessionUser {
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    name?: string | null;
  }
}
