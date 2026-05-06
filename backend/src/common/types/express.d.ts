import type { UserRole } from "@/common/lib/prisma-client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
