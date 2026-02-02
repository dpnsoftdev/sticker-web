// src/api/assets/assetService.ts
import { CopyObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StatusCodes } from "http-status-codes";
import path from "node:path";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";

import type { DirectUploadResponse, PresignedUploadBody, PresignedUploadResponse } from "./assetModel";
import { createS3Client } from "@/common/utils/s3";
import { S3_PREFIX_FOLDERS } from "@/common/constants";
import { AppError } from "@/common/middleware/errorHandler";

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

  /**
   * Copy an object within the same bucket. Returns the destination key.
   */
  copyObject: async (sourceKey: string, destKey: string): Promise<{ key: string }> => {
    if (!env.S3_BUCKET) {
      throw new Error("S3 upload is not configured (S3_BUCKET missing)");
    }
    const client = createS3Client();
    await client.send(
      new CopyObjectCommand({
        Bucket: env.S3_BUCKET,
        CopySource: `${env.S3_BUCKET}/${sourceKey}`,
        Key: destKey,
      }),
    );
    return { key: destKey };
  },

  /**
   * Move an object within the same bucket (copy then delete). Returns the destination key.
   */
  moveObject: async (sourceKey: string, destKey: string): Promise<{ key: string }> => {
    await assetService.copyObject(sourceKey, destKey);
    if (!env.S3_BUCKET) {
      throw new Error("S3 upload is not configured (S3_BUCKET missing)");
    }
    const client = createS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: sourceKey,
      }),
    );
    return { key: destKey };
  },

  /**
   * For each key that starts with "tmp/", move the object to "products/" (same basename).
   * Keys already under "products/" or other prefixes are returned unchanged.
   * Returns the final list of keys to store in the product.
   */
  moveTmpKeysToProducts: async (keys: string[]): Promise<string[]> => {
    try {
      if (!env.S3_BUCKET || !keys.length) {
        return keys;
      }
      const result: string[] = [];
      for (const key of keys) {
        const normalized = key.startsWith("/") ? key.slice(1) : key;
        if (normalized.startsWith(`${S3_PREFIX_FOLDERS.TMP}/`)) {
          const basename = path.basename(normalized);
          const destKey = `${S3_PREFIX_FOLDERS.PRODUCTS}/${basename}`;
          await assetService.moveObject(normalized, destKey);
          result.push(destKey);
        } else {
          result.push(normalized);
        }
      }
      return result;
    } catch (error) {
      console.error("Error moving tmp keys to products:", error);
      throw new AppError("Error moving tmp keys to products");
    }
  },
};
