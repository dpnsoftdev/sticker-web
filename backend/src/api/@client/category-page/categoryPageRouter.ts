// src/api/@client/category-page/categoryPageRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  CategoryPageProductsParamsSchema,
  CategoryPageProductsQuerySchema,
  CategoryPageProductsResponseSchema,
} from "./categoryPageModel";
import { categoryPageController } from "./categoryPageController";

export const categoryPageRegistry = new OpenAPIRegistry();
export const categoryPageRouter = Router();

categoryPageRegistry.registerPath({
  method: "get",
  path: "/category-page/{slug}/products",
  tags: ["Category Page (Client)"],
  description: "Get paginated product cards for a category by slug (minimal payload for listing)",
  request: {
    params: CategoryPageProductsParamsSchema,
    query: CategoryPageProductsQuerySchema,
  },
  responses: createApiResponse(CategoryPageProductsResponseSchema, "Paginated list of product cards for the category"),
});

categoryPageRouter.get("/:slug/products", categoryPageController.getProductsByCategorySlug);
