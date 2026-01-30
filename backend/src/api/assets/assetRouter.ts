// src/api/assets/assetRouter.ts
import { Router } from "express";
import multer from "multer";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";

import { DirectUploadResponseSchema, PresignedUploadRequestSchema, PresignedUploadResponseSchema } from "./assetModel";
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

assetRouter.post("/upload", upload.single("file"), assetController.uploadFile);
