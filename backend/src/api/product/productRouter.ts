// src/api/product/productRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly } from "@/common/middleware/authMiddleware";

import {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  GetProductSchema,
  GetProductBySlugSchema,
  ListProductSchema,
  DeleteProductAssetSchema,
  DeleteProductSchema,
  RecordProductViewSchema,
  RecordProductViewBodySchema,
  RecordProductViewResponseSchema,
} from "./productModel";

import { productController } from "./productController";
import { validateRequest } from "@/common/utils/httpHandlers";
import { optionalAuthMiddleware } from "@/common/middleware/authMiddleware";

export const productRegistry = new OpenAPIRegistry();
export const productRouter = Router();

/* =======================
GET /products
======================= */
productRegistry.register("Product", ProductSchema);
productRegistry.registerPath({
  method: "get",
  path: "/products",
  tags: ["Product"],
  description: "Get all products",
  request: {
    query: ListProductSchema.shape.query,
  },
  responses: createApiResponse(ProductSchema.array(), "Products retrieved"),
});

productRouter.get("/", validateRequest(ListProductSchema), productController.getListProducts);

/* =======================
  GET /products/by-slug/{slug}
======================= */
productRegistry.registerPath({
  method: "get",
  path: "/products/slug/{slug}",
  tags: ["Product"],
  description: "Get a product by slug",
  request: {
    params: GetProductBySlugSchema.shape.params,
  },
  responses: createApiResponse(ProductSchema, "Product retrieved"),
});

productRouter.get("/slug/:slug", validateRequest(GetProductBySlugSchema), productController.getProductBySlug);

/* =======================
  POST /products/{id}/views
======================= */
productRegistry.registerPath({
  method: "post",
  path: "/products/{id}/views",
  tags: ["Product"],
  description:
    "Record a product detail view (buffered in Redis; flushed to DB periodically). Optional duplicate suppression uses Redis SET NX on viewed:{userId}:{productId}.",
  request: {
    params: RecordProductViewSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: RecordProductViewBodySchema,
        },
      },
    },
  },
  responses: createApiResponse(RecordProductViewResponseSchema, "View recorded"),
});

productRouter.post(
  "/:id/views",
  optionalAuthMiddleware,
  validateRequest(RecordProductViewSchema),
  productController.recordView,
);

/* =======================
  GET /products/{id}
======================= */
productRegistry.registerPath({
  method: "get",
  path: "/products/{id}",
  tags: ["Product"],
  description: "Get a product by ID",
  request: {
    params: GetProductSchema.shape.params,
  },
  responses: createApiResponse(ProductSchema, "Product retrieved"),
});

productRouter.get("/:id", validateRequest(GetProductSchema), productController.getProductDetails);

/* =======================
  POST /products
======================= */
productRegistry.registerPath({
  method: "post",
  path: "/products",
  tags: ["Product"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProductSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ProductSchema, "Product created", 201),
});

productRouter.post("/", ...adminOnly, validateRequest(CreateProductSchema), productController.createProduct);

/* =======================
  PUT /products/{id}
======================= */
productRegistry.registerPath({
  method: "put",
  path: "/products/{id}",
  tags: ["Product"],
  description: "Update a product by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: UpdateProductSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateProductSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ProductSchema, "Product updated"),
});

productRouter.put("/:id", ...adminOnly, validateRequest(UpdateProductSchema), productController.updateProduct);

/* =======================
  DELETE /products/{id}
======================= */
productRegistry.registerPath({
  method: "delete",
  path: "/products/{id}",
  tags: ["Product"],
  description: "Delete a product by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: DeleteProductSchema.shape.params,
  },
  responses: createApiResponse(null, "Product deleted"),
});

productRouter.delete("/:id", ...adminOnly, validateRequest(DeleteProductSchema), productController.deleteProduct);

/* =======================
  DELETE /products/{id}/delete-asset
======================= */
productRegistry.registerPath({
  method: "delete",
  path: "/products/{id}/delete-asset",
  tags: ["Product"],
  description: "Delete a product asset by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: DeleteProductAssetSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: DeleteProductAssetSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(null, "Product asset deleted"),
});

productRouter.delete(
  "/:id/delete-asset",
  ...adminOnly,
  validateRequest(DeleteProductAssetSchema),
  productController.deleteProductAsset,
);
