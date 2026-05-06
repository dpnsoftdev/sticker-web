import { env } from "@/common/utils/envConfig";
import type { Product, Variant } from "@/common/lib/prisma-client";
import { ProductWithVariants } from "../types";
import type { Request } from "express";

/**
 * Build full URL for an image path (e.g. S3 key).
 * Uses AWS_CLOUDFRONT_BASE_URL. Safe for empty path.
 */
export function buildImageFullUrl(path: string): string {
  if (!path) return "";
  const isDev = env.NODE_ENV === "development" && !env.USE_PRODUCTION_ENV;
  const cloudfrontBaseUrl = isDev ? (env.AWS_CLOUDFRONT_BASE_URL_DEV ?? "") : (env.AWS_CLOUDFRONT_BASE_URL ?? "");
  const base = cloudfrontBaseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return normalized ? `${base}/${normalized}` : "";
}

/**
 * Map an array of image paths to full URLs.
 */
export function buildImageFullUrls(paths: string[]): string[] {
  return (paths ?? []).map(buildImageFullUrl);
}

export function isPreorderExpired(p: Product): boolean {
  if (p.productType !== "preorder" || !p.preorderEndsAt) return false;
  const end = p.preorderEndsAt instanceof Date ? p.preorderEndsAt : new Date(p.preorderEndsAt);
  return end.getTime() < Date.now();
}

/**
 * Available stock per variant: stockOnHand - stockReserved.
 */
export function getVariantAvailable(v: { stockOnHand?: number | null; stockReserved?: number | null }): number {
  const onHand = v.stockOnHand ?? 0;
  const reserved = v.stockReserved ?? 0;
  return Math.max(0, onHand - reserved);
}

/**
 * Product is sold out when: total available stock of all active variants <= 0, or preorder has expired.
 */
export function isSoldOutProduct(p: ProductWithVariants): boolean {
  const activeVariants = (p.variants ?? []).filter((v) => v.status === "active");
  const totalAvailable = activeVariants.reduce((sum, v) => sum + getVariantAvailable(v), 0);
  return totalAvailable <= 0 || isPreorderExpired(p);
}

export function getDefaultVariant(product: ProductWithVariants): Variant | null {
  const defaultVariant = product.variants?.find((v) => v.isDefault);
  return defaultVariant ?? product.variants?.[0] ?? null;
}

export function getDefaultProductImageUrl(product: ProductWithVariants): string {
  if (product.images?.length > 0 && product.images[0]) {
    return buildImageFullUrl(product.images[0]);
  }
  const defaultVariant = getDefaultVariant(product);
  const variantImages = defaultVariant?.images;
  if (variantImages && variantImages.length > 0 && variantImages[0]) {
    return buildImageFullUrl(variantImages[0]);
  }
  const fallbackVariant = product.variants?.[0];
  if (fallbackVariant?.images?.length > 0 && fallbackVariant.images[0]) {
    return buildImageFullUrl(fallbackVariant.images[0]);
  }
  return "";
}

export function normalizeS3Key(key: string): string {
  return key.startsWith("/") ? key.slice(1) : key;
}

/**
 * Client IP for rate limiting. With `trust proxy`, `req.ip` reflects X-Forwarded-For when present.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    const first = xff.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }
  const ip = req.ip || req.socket?.remoteAddress || "";
  return normalizeIp(ip) || "unknown";
}

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/, "").trim();
}
