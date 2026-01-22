"use client";

import * as React from "react";
import type { Variant } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export default function VariantSelector({
  variants,
  basePrice,
  onChange,
}: {
  variants: Variant[];
  basePrice: number;
  onChange?: (variant: Variant | null) => void;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    variants[0]?.id ?? null
  );

  const selected = React.useMemo(
    () => variants.find(v => v.id === selectedId) ?? null,
    [selectedId, variants]
  );

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
          setSelectedId(val);
        }}
      >
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Chọn phân loại" />
        </SelectTrigger>

        <SelectContent>
          {variants.map(v => {
            return (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected?.description ?? " "}
        </p>

        <p className="text-sm font-semibold text-primary">
          {formatVND(basePrice + (selected?.price ?? 0))}
        </p>
      </div>
    </div>
  );
}
