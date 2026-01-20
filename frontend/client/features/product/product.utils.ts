import { Product, Variant } from "@/types/product";

export function getProductPrice(product: Product, variant?: Variant | null): number {
  if (variant?.price !== null && variant?.price !== undefined) {
    return variant.price;
  }
  return product.price;
}

export function getProductStock(product: Product, variant?: Variant | null): number {
  if (variant?.stock !== null && variant?.stock !== undefined) {
    return variant.stock;
  }
  return product.stock;
}

export function getProductImage(product: Product, variant?: Variant | null): string {
  if (variant?.images && variant.images.length > 0) {
    return variant.images[0];
  }
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return "/placeholder-image.png";
}
