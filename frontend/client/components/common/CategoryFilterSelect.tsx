"use client";

import { useRouter } from "next/navigation";
import { List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/lib/constants";
import type { Category } from "@/types/product";

interface CategoryFilterSelectProps {
  categories: Category[];
  currentSlug: string;
}

export function CategoryFilterSelect({
  categories,
  currentSlug,
}: CategoryFilterSelectProps) {
  const router = useRouter();

  function onCategoryChange(slug: string) {
    if (slug === currentSlug) return;
    router.push(`${ROUTES.CATEGORY}/${slug}`);
  }

  return (
    <Select value={currentSlug} onValueChange={onCategoryChange}>
      <SelectTrigger className="h-10 w-full rounded-xl border-border bg-card text-muted-foreground cursor-pointer">
        <List className="mr-2 h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border bg-card">
        {categories.map(cat => (
          <SelectItem
            key={cat.id}
            value={cat.slug}
            className="rounded-lg cursor-pointer"
          >
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
