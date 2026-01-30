// src/api/product/productRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";

import {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  GetProductSchema,
  ListProductSchema,
} from "./productModel";

import { productController } from "./productController";
import { validateRequest } from "@/common/utils/httpHandlers";

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
  request: {
    query: ListProductSchema.shape.query,
  },
  responses: createApiResponse(ProductSchema.array(), "Products retrieved"),
});

productRouter.get("/", validateRequest(ListProductSchema), productController.getListProducts);

/* =======================
  GET /products/{id}
======================= */
productRegistry.registerPath({
  method: "get",
  path: "/products/{id}",
  tags: ["Product"],
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

productRouter.post("/", validateRequest(CreateProductSchema), productController.createProduct);

/* =======================
  PUT /products/{id}
======================= */
productRegistry.registerPath({
  method: "put",
  path: "/products/{id}",
  tags: ["Product"],
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

productRouter.put("/:id", validateRequest(UpdateProductSchema), productController.updateProduct);

/* =======================
  DELETE /products/{id}
======================= */
productRegistry.registerPath({
  method: "delete",
  path: "/products/{id}",
  tags: ["Product"],
  request: {
    params: GetProductSchema.shape.params,
  },
  responses: createApiResponse(null, "Product deleted"),
});

productRouter.delete("/:id", validateRequest(GetProductSchema), productController.deleteProduct);
