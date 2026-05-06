"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE =
  "https://d20m1ujgrryo2d.cloudfront.net/placeholder.png";

interface ProductImageSliderProps {
  images: string[];
  outOfStockByImageIndex: boolean[];
  productName: string;
  placeholderImage?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  imageContainerClassName?: string;
}

export function ProductImageSlider({
  images,
  outOfStockByImageIndex,
  productName,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  imageContainerClassName,
}: ProductImageSliderProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;
  const setActiveIndex = useCallback(
    (value: number | ((prev: number) => number)) => {
      const next = typeof value === "function" ? value(activeIndex) : value;
      if (!isControlled) setInternalIndex(next);
      onActiveIndexChange?.(next);
    },
    [isControlled, onActiveIndexChange, activeIndex]
  );

  const sources = images?.length ? images : [PLACEHOLDER_IMAGE];
  const currentSrc = sources[activeIndex] ?? PLACEHOLDER_IMAGE;
  const hasMultiple = sources.length > 1;

  const isOutOfStockAt = (index: number) =>
    Boolean(outOfStockByImageIndex[index]);
  const mainPreviewOutOfStock = isOutOfStockAt(activeIndex);

  const goPrev = useCallback(() => {
    setActiveIndex(i => (i <= 0 ? sources.length - 1 : i - 1));
  }, [sources.length, setActiveIndex]);

  const goNext = useCallback(() => {
    setActiveIndex(i => (i >= sources.length - 1 ? 0 : i + 1));
  }, [sources.length, setActiveIndex]);

  return (
    <div className="min-w-0 w-full max-w-full space-y-4">
      {/* Main preview + prev/next */}
      <div
        className={cn(
          "relative aspect-square w-full max-w-full overflow-hidden rounded-xl group",
          imageContainerClassName
        )}
      >
        <Image
          id="main-preview-image"
          src={currentSrc}
          alt={productName}
          fill
          priority
          className={cn(
            "object-contain transition-opacity duration-200",
            mainPreviewOutOfStock && "blur-[1px] saturate-75 opacity-90"
          )}
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        {mainPreviewOutOfStock && (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-background/20 dark:bg-background/25"
            aria-hidden
          >
            <span className="rounded-full border border-destructive/30 bg-destructive/90 px-5 py-2 text-sm font-bold tracking-wide text-white shadow-lg">
              Hết hàng
            </span>
          </div>
        )}
        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
              onClick={goPrev}
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
              onClick={goNext}
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex min-h-0 w-full min-w-0 max-w-full touch-pan-x gap-3 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth">
          {sources.map((src, idx) => (
            <button
              type="button"
              key={`${src}-${idx}`}
              id={`product-image-${idx}`}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                activeIndex === idx
                  ? "border-primary opacity-100 ring-2 ring-primary/30"
                  : "border-border opacity-60 hover:opacity-80"
              )}
              aria-label={`Ảnh ${idx + 1}`}
              aria-current={activeIndex === idx ? "true" : undefined}
            >
              <Image
                src={src || PLACEHOLDER_IMAGE}
                alt={`${productName} - ${idx + 1}`}
                fill
                className={cn(
                  "object-cover",
                  isOutOfStockAt(idx) && "opacity-80"
                )}
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
