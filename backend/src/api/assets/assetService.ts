// src/api/assets/assetService.ts
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StatusCodes } from "http-status-codes";
import path from "node:path";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";

import type { DirectUploadResponse, PresignedUploadBody, PresignedUploadResponse } from "./assetModel";
import { createS3Client } from "@/common/lib/s3";
import { S3_PREFIX_FOLDERS } from "@/common/constants";
import { AppError } from "@/common/middleware/errorHandler";

/** S3 cleanup: treat as already gone — safe to ignore and continue DB delete. */
const IGNORABLE_S3_DELETE_ERROR_CODES = new Set(["NoSuchKey", "NotFound"]);

export function isS3MissingObjectBenignError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const name = typeof e.name === "string" ? e.name : "";
  const code = typeof e.Code === "string" ? e.Code : typeof e.code === "string" ? (e.code as string) : "";
  return name === "NotFound" || name === "NoSuchKey" || IGNORABLE_S3_DELETE_ERROR_CODES.has(code);
}

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

  /**
   * List all object keys under a prefix (handles pagination).
   */
  listObjectsByPrefix: async (prefix: string): Promise<string[]> => {
    if (!env.S3_BUCKET) {
      throw new Error("S3 upload is not configured (S3_BUCKET missing)");
    }
    const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
    const client = createS3Client();
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET,
          Prefix: normalizedPrefix,
          ContinuationToken: continuationToken,
        }),
      );
      const contents = response.Contents ?? [];
      for (const obj of contents) {
        if (obj.Key) keys.push(obj.Key);
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
    return keys;
  },

  /**
   * Delete a single object from S3 by key.
   */
  deleteObject: async (key: string): Promise<void> => {
    if (!env.S3_BUCKET) {
      throw new Error("S3 is not configured (S3_BUCKET missing)");
    }
    const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
    const client = createS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: normalizedKey,
      }),
    );
  },

  /**
   * Delete all objects under a prefix (e.g. products/${productId}/).
   * Uses list then batch delete (S3 DeleteObjects accepts up to 1000 keys per request).
   */
  deleteObjectsByPrefix: async (prefix: string): Promise<{ deleted: number }> => {
    if (!env.S3_BUCKET) {
      throw new Error("S3 upload is not configured (S3_BUCKET missing)");
    }
    const keys = await assetService.listObjectsByPrefix(prefix);
    if (keys.length === 0) return { deleted: 0 };
    const client = createS3Client();
    const BATCH_SIZE = 1000;
    let deleted = 0;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const output = await client.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      deleted += output.Deleted?.length ?? 0;
      for (const errItem of output.Errors ?? []) {
        const code = errItem.Code ?? "";
        if (IGNORABLE_S3_DELETE_ERROR_CODES.has(code)) {
          console.warn("[S3] Delete skipped — key already missing:", errItem.Key, code);
          continue;
        }
        throw new Error(`S3 DeleteObjects failed for ${errItem.Key}: ${code} ${errItem.Message ?? ""}`);
      }
    }
    return { deleted };
  },

  /**
   * Delete a single object from S3 (admin). Key must be under tmp/, products/, or categories/.
   */
  adminDeleteObject: async (key: string): Promise<ServiceResponse<null>> => {
    const n = typeof key === "string" ? (key.startsWith("/") ? key.slice(1) : key) : "";
    if (!n || n.includes("..")) {
      return ServiceResponse.failure("Invalid key", null, StatusCodes.BAD_REQUEST);
    }
    const allowedPrefixes = [
      `${S3_PREFIX_FOLDERS.TMP}/`,
      `${S3_PREFIX_FOLDERS.PRODUCTS}/`,
      `${S3_PREFIX_FOLDERS.CATEGORIES}/`,
    ];
    if (!allowedPrefixes.some((p) => n.startsWith(p))) {
      return ServiceResponse.failure("Key prefix not allowed", null, StatusCodes.FORBIDDEN);
    }
    try {
      await assetService.deleteObject(key);
      return ServiceResponse.success("Object deleted", null, StatusCodes.OK);
    } catch (err) {
      console.error("adminDeleteObject:", err);
      return ServiceResponse.failure("Failed to delete object", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
