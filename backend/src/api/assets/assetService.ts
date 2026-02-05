// src/api/assets/assetService.ts
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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
   * Check if an object exists in S3. Throws AppError if not found.
   */
  checkObjectExists: async (key: string): Promise<void> => {
    if (!env.S3_BUCKET) {
      throw new Error("S3 upload is not configured (S3_BUCKET missing)");
    }
    const client = createS3Client();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        }),
      );
    } catch (err: unknown) {
      const isNotFound =
        err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "NotFound";
      const statusCode =
        err && typeof err === "object" && "$metadata" in err
          ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
          : undefined;
      if (isNotFound || statusCode === 404) {
        throw new AppError(`Image not found: ${key}`);
      }
      throw err;
    }
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
   * Move objects to a folder within the same bucket. Returns the destination keys.
   */
  moveTmpKeysToFolder: async (keys: string[], targetFolder: string): Promise<string[]> => {
    try {
      if (!env.S3_BUCKET || !Array.isArray(keys) || keys.length === 0) return keys ?? [];

      const tmpPrefix = `${S3_PREFIX_FOLDERS.TMP}/`;
      const normalize = (k: string) => (k.startsWith("/") ? k.slice(1) : k);

      const result: string[] = [];

      for (const rawKey of keys) {
        const normalized = normalize(rawKey);

        // not a tmp key => keep as-is
        if (!normalized.startsWith(tmpPrefix)) {
          result.push(normalized);
          continue;
        }

        const basename = path.posix.basename(normalized); // S3 keys use posix paths
        const destKey = `${targetFolder}/${basename}`.replace(/\/+/g, "/");

        await assetService.moveObject(normalized, destKey);
        result.push(destKey);
      }

      return result;
    } catch (error) {
      console.error("Error moving tmp keys:", error);
      throw new AppError("Error moving images");
    }
  },
};
