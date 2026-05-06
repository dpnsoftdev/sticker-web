// src/api/assets/assetModel.ts
import { z } from "zod";

/* =======================
  Pre-signed upload request/response
======================= */

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;

export const PresignedUploadBodySchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  prefix: z.string().optional().default("assets"),
});

export const PresignedUploadRequestSchema = z.object({
  body: PresignedUploadBodySchema,
});

export const PresignedUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresIn: z.number(),
});

export type PresignedUploadBody = z.infer<typeof PresignedUploadBodySchema>;
export type PresignedUploadResponse = z.infer<typeof PresignedUploadResponseSchema>;

/* =======================
  Direct file upload (multipart) response
======================= */

export const DirectUploadResponseSchema = z.object({
  key: z.string(),
  message: z.string().optional(),
});

export type DirectUploadResponse = z.infer<typeof DirectUploadResponseSchema>;

export const DeleteAssetObjectSchema = z.object({
  body: z.object({
    key: z.string().min(1, "key is required"),
  }),
});
