import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  LoginSchema,
  RegisterSchema,
  RegisterStartSchema,
  RegisterVerifySchema,
  RegisterStartResponseSchema,
  RefreshSchema,
  TokenResponseSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/api/auth/authModel";
import { authController } from "@/api/auth/authController";
import { validateRequest } from "@/common/utils/httpHandlers";
import { authMiddleware } from "@/common/middleware/authMiddleware";
import { StatusCodes } from "http-status-codes";
import { UserSchema } from "@/api/user/userModel";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

authRegistry.register("TokenResponse", TokenResponseSchema);
authRegistry.register("RegisterStartResponse", RegisterStartResponseSchema);

authRegistry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TokenResponseSchema, "Login successful", StatusCodes.OK),
});

authRouter.post("/login", validateRequest(LoginSchema), authController.login);

authRegistry.registerPath({
  method: "post",
  path: "/auth/register/start",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterStartSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RegisterStartResponseSchema, "OTP sent; continue with verify", StatusCodes.OK),
});

authRouter.post(
  "/register/start",
  validateRequest(RegisterStartSchema),
  authController.startRegistration,
);

authRegistry.registerPath({
  method: "post",
  path: "/auth/register/verify",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterVerifySchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TokenResponseSchema, "Registration completed", StatusCodes.CREATED),
});

authRouter.post(
  "/register/verify",
  validateRequest(RegisterVerifySchema),
  authController.verifyRegistration,
);

authRegistry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TokenResponseSchema, "Registration successful", StatusCodes.CREATED),
});

authRouter.post("/register", validateRequest(RegisterSchema), authController.register);

authRegistry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RefreshSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TokenResponseSchema, "Tokens refreshed"),
});

authRouter.post("/refresh", validateRequest(RefreshSchema), authController.refresh);

authRegistry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: createApiResponse(UserSchema, "Current authenticated user"),
});

authRouter.get("/me", authMiddleware, authController.me);

authRegistry.registerPath({
  method: "patch",
  path: "/auth/me",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateProfileSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserSchema, "Profile updated"),
});

authRouter.patch(
  "/me",
  authMiddleware,
  validateRequest(UpdateProfileSchema),
  authController.updateMe,
);

authRegistry.registerPath({
  method: "patch",
  path: "/auth/me/password",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangePasswordSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.null(), "Password updated"),
});

authRouter.patch(
  "/me/password",
  authMiddleware,
  validateRequest(ChangePasswordSchema),
  authController.changePassword,
);
