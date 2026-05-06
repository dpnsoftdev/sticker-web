import type { Product, Variant } from "@/types/product";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cartItemIdOf = (productId: string, variantId?: string) =>
  `${productId}::${variantId ?? "default"}`;

export const clampQty = (n: number) =>
  Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;

export const getUnitPrice = (item: {
  campaignPrice?: number;
  price?: number;
}) => item.campaignPrice ?? item.price ?? 0;

export const formatVND = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export function isPreorderExpired(p: Product) {
  if (p.product_type !== "preorder" || !p.preorder?.end_date) return false;
  const end = new Date(p.preorder.end_date);
  // compare with current time (server time)
  return end.getTime() < Date.now();
}

/** Sold out when total (variant) stock <= 0 or preorder has expired. */
export function isSoldOutProduct(p: Product) {
  return (p.stock ?? 0) <= 0 || isPreorderExpired(p);
}

/** Matches add-to-cart: variant row stock, else product-level stock. */
export function getEffectiveVariantStock(
  variant: Variant | null,
  product: Product
): number {
  if (!variant) return product.stock ?? 0;
  return variant.stock ?? product.stock ?? 0;
}

/**
 * Prefer default variant if it has stock; otherwise first in-list variant with stock
 * (same order as selection UI). If all are out of stock, keep default or first.
 */
export function getPreferredInitialVariant(
  variants: Variant[],
  product: Product
): Variant | null {
  if (!variants.length) return null;
  const stockOf = (v: Variant) => getEffectiveVariantStock(v, product);
  const defaultV = variants.find(v => v.is_default) ?? null;
  if (defaultV && stockOf(defaultV) > 0) return defaultV;
  const firstAvailable = variants.find(v => stockOf(v) > 0);
  if (firstAvailable) return firstAvailable;
  return defaultV ?? variants[0];
}

/** Combined gallery: product images first, then each variant’s images in variant order. */
export function buildProductGallery(product: Product, variants: Variant[]) {
  const galleryImages: string[] = [];
  /** True when that slide should show out-of-stock styling (product-wide or that variant’s stock). */
  const outOfStockByImageIndex: boolean[] = [];
  const variantFirstImageIndex: Record<string, number> = {};

  const productSoldOut = isSoldOutProduct(product);

  (product.images ?? []).forEach(url => {
    galleryImages.push(url);
    outOfStockByImageIndex.push(productSoldOut);
  });

  variants.forEach(v => {
    const imgs = v.images ?? [];
    const variantOos =
      productSoldOut || getEffectiveVariantStock(v, product) <= 0;
    if (imgs.length > 0) variantFirstImageIndex[v.id] = galleryImages.length;
    imgs.forEach(url => {
      galleryImages.push(url);
      outOfStockByImageIndex.push(variantOos);
    });
  });

  return { galleryImages, variantFirstImageIndex, outOfStockByImageIndex };
}
