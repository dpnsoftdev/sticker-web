// src/api/homepage/homepageRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { HomepageResponseSchema } from "./homepageModel";
import { homepageController } from "./homepageController";

export const homepageRegistry = new OpenAPIRegistry();
export const homepageRouter = Router();

homepageRegistry.registerPath({
  method: "get",
  path: "/homepage",
  tags: ["Homepage"],
  responses: createApiResponse(HomepageResponseSchema, "Homepage categories with products"),
});

homepageRouter.get("/", homepageController.getCategoriesWithProducts);
