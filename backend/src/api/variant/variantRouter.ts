// src/api/variant/variantRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly } from "@/common/middleware/authMiddleware";

import {
  VariantSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  GetVariantSchema,
  ListVariantSchema,
  RemoveVariantImageSchema,
} from "./variantModel";

import { variantController } from "./variantController";
import { validateRequest } from "@/common/utils/httpHandlers";

export const variantRegistry = new OpenAPIRegistry();
export const variantRouter = Router();

/* =======================
  GET /variants
======================= */
variantRegistry.register("Variant", VariantSchema);
variantRegistry.registerPath({
  method: "get",
  path: "/variants",
  tags: ["Variant"],
  description: "Get all variants",
  request: {
    query: ListVariantSchema.shape.query,
  },
  responses: createApiResponse(VariantSchema.array(), "Variants retrieved"),
});

variantRouter.get("/", validateRequest(ListVariantSchema), variantController.getListVariants);

/* =======================
  GET /variants/{id}
======================= */
variantRegistry.registerPath({
  method: "get",
  path: "/variants/{id}",
  tags: ["Variant"],
  description: "Get a variant by ID",
  request: {
    params: GetVariantSchema.shape.params,
  },
  responses: createApiResponse(VariantSchema, "Variant retrieved"),
});

variantRouter.get("/:id", validateRequest(GetVariantSchema), variantController.getVariantDetails);

/* =======================
  POST /variants
======================= */
variantRegistry.registerPath({
  method: "post",
  path: "/variants",
  tags: ["Variant"],
  description: "Create a new variant",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateVariantSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(VariantSchema, "Variant created", 201),
});

variantRouter.post("/", ...adminOnly, validateRequest(CreateVariantSchema), variantController.createVariant);

/* =======================
  PUT /variants/{id}
======================= */
variantRegistry.registerPath({
  method: "put",
  path: "/variants/{id}",
  tags: ["Variant"],
  description: "Update a variant by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: UpdateVariantSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateVariantSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(VariantSchema, "Variant updated"),
});

variantRouter.put("/:id", ...adminOnly, validateRequest(UpdateVariantSchema), variantController.updateVariant);

/* =======================
  POST /variants/{id}/delete-asset
======================= */
variantRegistry.registerPath({
  method: "post",
  path: "/variants/{id}/delete-asset",
  tags: ["Variant"],
  description: "Delete a variant image from S3 and remove its key from the variant",
  security: [{ bearerAuth: [] }],
  request: {
    params: RemoveVariantImageSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: RemoveVariantImageSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(VariantSchema, "Variant image removed"),
});

variantRouter.post(
  "/:id/delete-asset",
  ...adminOnly,
  validateRequest(RemoveVariantImageSchema),
  variantController.removeVariantImage,
);

/* =======================
  DELETE /variants/{id}
======================= */
variantRegistry.registerPath({
  method: "delete",
  path: "/variants/{id}",
  tags: ["Variant"],
  description: "Delete a variant by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: GetVariantSchema.shape.params,
  },
  responses: createApiResponse(null, "Variant deleted"),
});

variantRouter.delete("/:id", ...adminOnly, validateRequest(GetVariantSchema), variantController.deleteVariant);
