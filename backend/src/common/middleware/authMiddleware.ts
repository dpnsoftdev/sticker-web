import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import { env } from "@/common/utils/envConfig";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { JwtPayload } from "@/common/types/express";
import { UserRole } from "../types";
import { USER_ROLES } from "../constants";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    const response = ServiceResponse.failure("Authorization token required", null, StatusCodes.UNAUTHORIZED);
    handleServiceResponse(response, res);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & JwtPayload;
    if (decoded.type !== "access") {
      const response = ServiceResponse.failure("Invalid token type", null, StatusCodes.UNAUTHORIZED);
      handleServiceResponse(response, res);
      return;
    }
    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      type: "access",
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch {
    const response = ServiceResponse.failure("Invalid or expired token", null, StatusCodes.UNAUTHORIZED);
    handleServiceResponse(response, res);
  }
}

/**
 * Requires the request to be authenticated and the user to have one of the allowed roles.
 * Use after authMiddleware.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response = ServiceResponse.failure("Unauthorized", null, StatusCodes.UNAUTHORIZED);
      handleServiceResponse(response, res);
      return;
    }
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      const response = ServiceResponse.failure("Forbidden", null, StatusCodes.FORBIDDEN);
      handleServiceResponse(response, res);
      return;
    }
    next();
  };
}

/** Owner has full access; use for all admin-only APIs. */
export const adminOnly = [authMiddleware, requireRole([USER_ROLES.OWNER, USER_ROLES.ADMIN])];

/** Owner has full access; use for all owner-only APIs. */
export const ownerOnly = [authMiddleware, requireRole([USER_ROLES.OWNER])];

/**
 * Sets `req.user` when a valid Bearer access token is present; otherwise continues without error.
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & JwtPayload;
    if (decoded.type === "access") {
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        type: "access",
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }
  } catch {
    // ignore invalid/expired token
  }
  next();
}
