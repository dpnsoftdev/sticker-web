"use client";

import * as React from "react";
import type { Product, Variant } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cn,
  getEffectiveVariantStock,
  getPreferredInitialVariant,
} from "@/lib/utils";

export default function VariantSelector({
  variants,
  product,
  value,
  onChange,
}: {
  variants: Variant[];
  product: Product;
  /** Controlled: selected variant id */
  value?: string | null;
  onChange?: (variant: Variant | null) => void;
}) {
  const [internalId, setInternalId] = React.useState<string | null>(
    () =>
      getPreferredInitialVariant(variants, product)?.id ??
      variants[0]?.id ??
      null
  );
  const isControlled = value !== undefined;
  const selectedId = isControlled ? (value ?? null) : internalId;

  const selected = React.useMemo(
    () => variants.find(v => v.id === selectedId) ?? null,
    [selectedId, variants]
  );

  const selectedOutOfStock =
    selected !== null && getEffectiveVariantStock(selected, product) <= 0;

  const prevSelectedRef = React.useRef<Variant | null>(null);
  React.useEffect(() => {
    // Only call onChange if the variant actually changed
    if (selected?.id !== prevSelectedRef.current?.id) {
      onChange?.(selected);
      prevSelectedRef.current = selected;
    }
  }, [selected, onChange]);

  if (!variants.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Sản phẩm chưa có phân loại.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Select
        value={selectedId ?? ""}
        onValueChange={(val: string) => {
          if (!isControlled) setInternalId(val);
          const v = variants.find(x => x.id === val) ?? null;
          onChange?.(v);
        }}
      >
        <SelectTrigger
          className={cn(
            "rounded-xl",
            selectedOutOfStock &&
              "border-dashed border-muted-foreground/50 bg-muted/25 text-muted-foreground"
          )}
        >
          <SelectValue placeholder="Chọn phân loại" />
        </SelectTrigger>

        <SelectContent>
          {variants.map(v => {
            const oos = getEffectiveVariantStock(v, product) <= 0;
            return (
              <SelectItem
                key={v.id}
                value={v.id}
                className={cn(oos && "text-muted-foreground")}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2 pr-1">
                  <span
                    className={cn(
                      "truncate",
                      oos && "line-through decoration-muted-foreground/60"
                    )}
                  >
                    {v.name}
                  </span>
                  {oos && (
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Hết hàng
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {typeof selected?.description === "string" ? (
            <>
              <span className="text-destructive" aria-hidden>
                {"* "}
              </span>
              {selected.description}
            </>
          ) : (
            (selected?.description ?? " ")
          )}
        </p>
      </div>
    </div>
  );
}
