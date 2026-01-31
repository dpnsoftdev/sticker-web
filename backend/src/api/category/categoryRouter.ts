// src/api/category/categoryRouter.ts
import { Router } from "express";
import multer from "multer";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { CategorySchema, CreateCategorySchema } from "./categoryModel";
import { categoryController } from "./categoryController";
import { validateRequest } from "@/common/utils/httpHandlers";

export const categoryRegistry = new OpenAPIRegistry();
export const categoryRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

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
  path: "/categories/create",
  tags: ["Category"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["name", "slug"],
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string" },
              images: {
                type: "array",
                items: { type: "string", format: "binary" },
                maxItems: 5,
                description: "Category images (max 5, 20MB each)",
              },
            },
          },
        },
      },
    },
  },
  responses: createApiResponse(CategorySchema, "Category created", 201),
});

categoryRouter.post(
  "/create",
  upload.array("images", 5),
  validateRequest(CreateCategorySchema),
  categoryController.create,
);
