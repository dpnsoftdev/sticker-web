// src/api/variant/variantRouter.ts
import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";

import {
  VariantSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  GetVariantSchema,
  ListVariantSchema,
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

variantRouter.post("/", validateRequest(CreateVariantSchema), variantController.createVariant);

/* =======================
  PUT /variants/{id}
======================= */
variantRegistry.registerPath({
  method: "put",
  path: "/variants/{id}",
  tags: ["Variant"],
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

variantRouter.put("/:id", validateRequest(UpdateVariantSchema), variantController.updateVariant);

/* =======================
  DELETE /variants/{id}
======================= */
variantRegistry.registerPath({
  method: "delete",
  path: "/variants/{id}",
  tags: ["Variant"],
  request: {
    params: GetVariantSchema.shape.params,
  },
  responses: createApiResponse(null, "Variant deleted"),
});

variantRouter.delete("/:id", validateRequest(GetVariantSchema), variantController.deleteVariant);
