"use client";

import * as React from "react";
import type { Product, Variant } from "@/types/product";
import VariantSelector from "./VariantSelector";
import AddToCartBar from "./AddToCartBar";

interface ProductCartControlsProps {
  product: Product;
  variants: Variant[];
  basePrice: number;
}

export default function ProductCartControls({
  product,
  variants,
  basePrice,
}: ProductCartControlsProps) {
  const [selectedVariant, setSelectedVariant] = React.useState<Variant | null>(
    variants[0] ?? null
  );
  const [quantity, setQuantity] = React.useState(1);

  // Reset and clamp quantity when variant changes
  React.useEffect(() => {
    const stock = selectedVariant?.stock ?? product.stock ?? 0;
    setQuantity(Math.min(1, stock));
  }, [selectedVariant?.id, selectedVariant?.stock, product.stock]);

  return (
    <>
      {/* Variant selector */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Phân loại
        </h2>
        <VariantSelector
          variants={variants}
          basePrice={basePrice}
          onChange={setSelectedVariant}
        />
      </div>

      {/* Add to cart */}
      <AddToCartBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        basePrice={basePrice}
        onQuantityChange={setQuantity}
      />
    </>
  );
}
