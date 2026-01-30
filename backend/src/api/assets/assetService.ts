// src/api/assets/assetService.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StatusCodes } from "http-status-codes";
import path from "node:path";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";

import type { DirectUploadResponse, PresignedUploadBody, PresignedUploadResponse } from "./assetModel";
import { createS3Client } from "@/common/utils/s3";

export const assetService = {
  getPresignedUploadUrl: async (
    body: PresignedUploadBody,
  ): Promise<ServiceResponse<PresignedUploadResponse | null>> => {
    if (!env.S3_BUCKET) {
      return ServiceResponse.failure(
        "S3 upload is not configured (S3_BUCKET missing)",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const ext = path.extname(body.fileName) || "";
    const key = `${body.prefix}/${randomUUID()}${ext}`;

    const client = createS3Client();
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: body.contentType,
    });

    const expiresIn = Math.min(Math.max(env.S3_PRESIGNED_EXPIRES_IN, 60), 604800); // 1 min to 7 days

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return ServiceResponse.success("Presigned upload URL created", {
      uploadUrl,
      key,
      expiresIn,
    });
  },

  uploadFile: async (
    buffer: Buffer,
    contentType: string,
    prefix = "assets",
  ): Promise<ServiceResponse<DirectUploadResponse | null>> => {
    if (!env.S3_BUCKET) {
      return ServiceResponse.failure(
        "S3 upload is not configured (S3_BUCKET missing)",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const extByMime: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "application/pdf": ".pdf",
    };
    const ext = extByMime[contentType] ?? "";
    const key = `${prefix}/${randomUUID()}${ext}`;

    const client = createS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return ServiceResponse.success("File uploaded", {
      key,
      message: "Use this key to reference the file (e.g. build public URL).",
    });
  },
};
