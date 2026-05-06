// src/api/assets/assetRouter.ts
import { Router } from "express";
import multer from "multer";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly } from "@/common/middleware/authMiddleware";
import { validateRequest } from "@/common/utils/httpHandlers";

import {
  DeleteAssetObjectSchema,
  DirectUploadResponseSchema,
  PresignedUploadRequestSchema,
  PresignedUploadResponseSchema,
} from "./assetModel";
import { assetController } from "./assetController";

export const assetRegistry = new OpenAPIRegistry();
export const assetRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* =======================
  POST /assets/presigned-upload
======================= */
assetRegistry.registerPath({
  method: "post",
  path: "/assets/presigned-upload",
  tags: ["Assets"],
  description: "Get a presigned upload URL for a file",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PresignedUploadRequestSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PresignedUploadResponseSchema, "Presigned upload URL created", 201),
});

assetRouter.post(
  "/presigned-upload",
  ...adminOnly,
  validateRequest(PresignedUploadRequestSchema),
  assetController.getPresignedUploadUrl,
);

/* =======================
  POST /assets/upload (multipart – directly upload a file to S3)
======================= */
assetRegistry.registerPath({
  method: "post",
  path: "/assets/upload",
  tags: ["Assets"],
  description: "Upload a file to S3",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["file"],
            properties: {
              file: {
                type: "string",
                format: "binary",
                description: "File to upload (images or PDF)",
              },
              prefix: {
                type: "string",
                default: "assets",
                description: "S3 key prefix (folder)",
              },
            },
          },
        },
      },
    },
  },
  responses: createApiResponse(DirectUploadResponseSchema, "File uploaded to S3", 201),
});

assetRouter.post("/upload", ...adminOnly, upload.single("file"), assetController.uploadFile);

/* =======================
  POST /assets/delete
======================= */
assetRegistry.registerPath({
  method: "post",
  path: "/assets/delete",
  tags: ["Assets"],
  description: "Delete an object from S3 by key (allowed prefixes: tmp/, products/, categories/)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: DeleteAssetObjectSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(null, "Object deleted"),
});

assetRouter.post("/delete", ...adminOnly, validateRequest(DeleteAssetObjectSchema), assetController.deleteObject);
