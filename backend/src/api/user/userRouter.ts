import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetUserSchema, UserSchema } from "@/api/user/userModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { adminOnly } from "@/common/middleware/authMiddleware";
import { userController } from "./userController";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register("User", UserSchema);

userRegistry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  description: "Get all users",
  security: [{ bearerAuth: [] }],
  responses: createApiResponse(z.array(UserSchema), "Success"),
});

userRouter.get("/", ...adminOnly, userController.getUsers);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  description: "Get a user by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe("User ID"),
    }),
  },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.get("/:id", ...adminOnly, validateRequest(GetUserSchema), userController.getUser);
