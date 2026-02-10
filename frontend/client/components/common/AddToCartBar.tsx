"use client";

import type { Product, Variant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";

interface AddToCartBarProps {
  product: Product;
  selectedVariant: Variant | null;
  quantity: number;
  basePrice: number;
  onQuantityChange: (quantity: number) => void;
}

export default function AddToCartBar({
  product,
  selectedVariant,
  quantity,
  basePrice,
  onQuantityChange,
}: AddToCartBarProps) {
  const { addItem } = useCartStore();

  const stock = selectedVariant?.stock ?? product.stock ?? 0;

  const getProductImage = (product: Product, variant: Variant | null) => {
    if (variant && Array.isArray(variant.images) && variant.images.length > 0) {
      return variant.images[0];
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return undefined;
  };

  const handleAddToCart = () => {
    const finalPrice = basePrice + (selectedVariant?.price ?? 0);
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? undefined,
      quantity: quantity,
      productName: product.name,
      variantName: selectedVariant?.name ?? undefined,
      price: finalPrice,
      campaignPrice: undefined, // Set if you have campaign pricing logic
      image: getProductImage(product, selectedVariant),
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Số lượng</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Kho: {stock ?? 0}
          </span>

          <div className="flex items-center rounded-xl border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none rounded-l-xl"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Giảm số lượng"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="min-w-10 text-center text-sm font-medium">
              {quantity}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none rounded-r-xl"
              onClick={() => onQuantityChange(Math.min(stock, quantity + 1))}
              aria-label="Tăng số lượng"
              disabled={quantity >= stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleAddToCart}
        disabled={stock <= 0}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Thêm vào giỏ
      </Button>
    </div>
  );
}
