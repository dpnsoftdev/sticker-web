"use client";

import type { Product, Variant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart.store";
import { cartItemIdOf } from "@/lib/utils";

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
  const { addItem, items } = useCartStore();

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
    if (stock <= 0) return;

    const cartItemId = cartItemIdOf(
      product.id,
      selectedVariant?.id ?? undefined
    );
    const existingQty =
      items.find(i => i.cartItemId === cartItemId)?.quantity ?? 0;
    const totalAfterAdd = existingQty + quantity;

    if (totalAfterAdd > stock) {
      if (existingQty >= stock) {
        toast.error("Đã đạt số lượng tối đa cho sản phẩm này.", {
          description: `Tồn kho: ${stock}. Giỏ hàng của bạn đã có ${existingQty} sản phẩm.`,
        });
      } else {
        toast.error("Không đủ hàng để thêm số lượng này.", {
          description: `Còn ${stock} trong kho, bạn đã có ${existingQty} trong giỏ — tối đa thêm được ${stock - existingQty}.`,
        });
      }
      return;
    }

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
    toast.success("Đã thêm vào giỏ hàng", {
      description: product.name,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground mb-3">
          Số lượng
        </div>
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
        variant={"default"}
        className="mt-5 h-12 w-full rounded-2xl"
        onClick={handleAddToCart}
        disabled={stock <= 0}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Thêm vào giỏ
      </Button>
    </div>
  );
}
