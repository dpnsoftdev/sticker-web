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
  defaultVariantId,
  onChange,
}: {
  variants: Variant[];
  basePrice: number;
  defaultVariantId?: string;
  onChange?: (variant: Variant | null) => void;
}) {
  const initialId = defaultVariantId ?? variants[0]?.id ?? "";
  const [selectedId, setSelectedId] = React.useState(initialId);

  const selected = React.useMemo(
    () => variants.find(v => v.id === selectedId) ?? null,
    [selectedId, variants]
  );

  React.useEffect(() => {
    onChange?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const displayPrice = React.useMemo(() => {
    if (!selected) return basePrice;
    // price trong Variant nếu bạn dùng kiểu "delta" (như mock ở trên)
    // Nếu bạn dùng price absolute thì đổi logic tại đây.
    const delta = selected.price ?? 0;
    return basePrice + delta;
  }, [basePrice, selected]);

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
        value={selectedId}
        onValueChange={(val: string) => setSelectedId(val)}
      >
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Chọn phân loại" />
        </SelectTrigger>

        <SelectContent>
          {variants.map(v => {
            const delta = v.price ?? 0;
            const priceLabel =
              delta === 0
                ? ""
                : delta > 0
                  ? ` (+${formatVND(delta)})`
                  : ` (${formatVND(delta)})`;

            return (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
                {priceLabel}
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
          {formatVND(displayPrice)}
        </p>
      </div>
    </div>
  );
}
