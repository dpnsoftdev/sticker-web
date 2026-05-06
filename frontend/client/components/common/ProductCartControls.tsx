"use client";

import * as React from "react";
import type { Product, Variant } from "@/types/product";
import VariantSelector from "./VariantSelector";
import AddToCartBar from "./AddToCartBar";
import { getPreferredInitialVariant } from "@/lib/utils";

interface ProductCartControlsProps {
  product: Product;
  variants: Variant[];
  basePrice: number;
  /** Controlled: selected variant (e.g. to sync gallery and price) */
  selectedVariant?: Variant | null;
  /** When variant changes (for controlled mode) */
  onVariantChange?: (variant: Variant | null) => void;
}

export default function ProductCartControls({
  product,
  variants,
  basePrice,
  selectedVariant: controlledVariant,
  onVariantChange,
}: ProductCartControlsProps) {
  const [internalVariant, setInternalVariant] = React.useState<Variant | null>(
    () => getPreferredInitialVariant(variants, product)
  );
  const isControlled = controlledVariant !== undefined;
  const selectedVariant = isControlled ? controlledVariant : internalVariant;

  const [quantity, setQuantity] = React.useState(1);

  const prevVariantIdRef = React.useRef<string | null>(
    selectedVariant?.id ?? null
  );

  React.useEffect(() => {
    const id = selectedVariant?.id ?? null;
    const maxQty = selectedVariant?.stock ?? product.stock ?? 0;

    if (id !== prevVariantIdRef.current) {
      prevVariantIdRef.current = id;
      setQuantity(1);
      return;
    }

    if (maxQty > 0) {
      setQuantity(q => Math.min(q, maxQty));
    }
  }, [selectedVariant?.id, selectedVariant?.stock, product.stock]);

  const handleVariantChange = React.useCallback(
    (v: Variant | null) => {
      if (!isControlled) setInternalVariant(v);
      onVariantChange?.(v);
    },
    [isControlled, onVariantChange]
  );

  return (
    <>
      {/* Variant selector */}
      {variants.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Phân loại
          </h2>
          <VariantSelector
            variants={variants}
            product={product}
            value={selectedVariant?.id}
            onChange={handleVariantChange}
          />
        </>
      )}

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
