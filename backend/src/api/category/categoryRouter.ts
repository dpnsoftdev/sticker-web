// src/api/category/categoryRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { CategorySchema, CreateCategorySchema } from "./categoryModel";
import { categoryController } from "./categoryController";
import { validateRequest } from "@/common/utils/httpHandlers";

export const categoryRegistry = new OpenAPIRegistry();
export const categoryRouter = Router();

/* =======================
  GET /categories
======================= */
categoryRegistry.register("Category", CategorySchema);
categoryRegistry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Category"],
  responses: createApiResponse(CategorySchema.array(), "Categories retrieved"),
});

categoryRouter.get("/", categoryController.getList);

/* =======================
  POST /categories
======================= */
categoryRegistry.registerPath({
  method: "post",
  path: "/categories",
  tags: ["Category"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategorySchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(CategorySchema, "Category created", 201),
});

categoryRouter.post("/create", validateRequest(CreateCategorySchema), categoryController.create);
