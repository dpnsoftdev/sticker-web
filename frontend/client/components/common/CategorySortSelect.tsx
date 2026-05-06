"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSort } from "@/features/product/product.api";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mặc định (Mới nhất)" },
  { value: "price_asc", label: "Giá: Thấp đến cao" },
  { value: "price_desc", label: "Giá: Cao đến thấp" },
  { value: "name_asc", label: "Tên A-Z" },
];

interface CategorySortSelectProps {
  currentSort: ProductSort;
}

export function CategorySortSelect({ currentSort }: CategorySortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onSortChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sort", value);
    next.delete("page"); // reset to page 1 when changing sort
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={currentSort} onValueChange={onSortChange}>
      <SelectTrigger className="h-10 w-full rounded-xl border-border bg-card text-muted-foreground cursor-pointer">
        <ArrowUpDown className="mr-2 h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border bg-card">
        {SORT_OPTIONS.map(opt => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="rounded-lg cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
