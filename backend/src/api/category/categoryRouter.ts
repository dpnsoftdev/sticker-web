// src/api/category/categoryRouter.ts
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly } from "@/common/middleware/authMiddleware";
import { CategorySchema, CreateCategorySchema, DeleteCategoryAssetSchema, UpdateCategorySchema } from "./categoryModel";
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
  description: "Get all categories",
  responses: createApiResponse(CategorySchema.array(), "Categories retrieved"),
});

categoryRouter.get("/", categoryController.getList);

/* =======================
  GET /categories/slug/:slug
======================= */
categoryRegistry.registerPath({
  method: "get",
  path: "/categories/slug/{slug}",
  tags: ["Category"],
  description: "Get a category by slug",
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: createApiResponse(CategorySchema, "Category retrieved by slug"),
});
categoryRouter.get("/slug/:slug", categoryController.getBySlug);

/* =======================
  POST /categories
======================= */
categoryRegistry.registerPath({
  method: "post",
  path: "/categories/create",
  tags: ["Category"],
  description: "Create a new category",
  security: [{ bearerAuth: [] }],
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
  ...adminOnly,
  upload.array("images", 5),
  validateRequest(CreateCategorySchema),
  categoryController.create,
);

/* =======================
  GET /categories/:id
======================= */
categoryRegistry.registerPath({
  method: "get",
  path: "/categories/{id}",
  tags: ["Category"],
  description: "Get a category by ID",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: createApiResponse(CategorySchema, "Category retrieved"),
});
categoryRouter.get("/:id", categoryController.getById);

/* =======================
  PUT /categories/:id
======================= */
categoryRegistry.registerPath({
  method: "put",
  path: "/categories/{id}",
  tags: ["Category"],
  description: "Update a category by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string" },
              images: {
                type: "array",
                items: { type: "string", format: "binary" },
                maxItems: 5,
              },
            },
          },
        },
      },
    },
  },
  responses: createApiResponse(CategorySchema, "Category updated"),
});
categoryRouter.put(
  "/:id",
  ...adminOnly,
  upload.array("images", 5),
  validateRequest(UpdateCategorySchema),
  categoryController.update,
);

/* =======================
  DELETE /categories/:id
======================= */
categoryRegistry.registerPath({
  method: "delete",
  path: "/categories/{id}",
  tags: ["Category"],
  description: "Delete a category by ID",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: createApiResponse(z.null(), "Category deleted"),
});
categoryRouter.delete("/:id", ...adminOnly, categoryController.delete);

/* =======================
  DELETE /categories/:id/delete-asset
======================= */
categoryRegistry.registerPath({
  method: "delete",
  path: "/categories/{id}/delete-asset",
  tags: ["Category"],
  description: "Delete a category asset by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: DeleteCategoryAssetSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: DeleteCategoryAssetSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.null(), "Category asset deleted"),
});
categoryRouter.delete(
  "/:id/delete-asset",
  ...adminOnly,
  validateRequest(DeleteCategoryAssetSchema),
  categoryController.deleteCategoryAsset,
);
