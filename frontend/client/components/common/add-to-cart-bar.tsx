"use client";

import * as React from "react";
import type { Product, Variant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function AddToCartBar({
  product,
  variants,
}: {
  product: Product;
  variants: Variant[];
}) {
  const { addItem } = useCart();
  const [qty, setQty] = React.useState(1);
  const [selectedVariant] = React.useState<Variant | null>(variants[0] ?? null);

  const stock = selectedVariant?.stock ?? product.stock ?? 0;

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
              onClick={() => setQty(q => Math.max(1, q - 1))}
              aria-label="Giảm số lượng"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="min-w-10 text-center text-sm font-medium">
              {qty}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none rounded-r-xl"
              onClick={() => setQty(q => q + 1)}
              aria-label="Tăng số lượng"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => {
          addItem?.({
            productId: product.id,
            variantId: selectedVariant?.id ?? undefined,
            quantity: qty,
          });
        }}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Thêm vào giỏ
      </Button>
    </div>
  );
}
