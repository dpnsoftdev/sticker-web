"use client";

import * as React from "react";
import type { Product, Variant } from "@/types/product";
import ProductCartControls from "./ProductCartControls";
import { PreorderCountdown } from "./PreorderCountdown";
import { ProductImageSlider } from "./ProductImageSlider";
import { ProductViewTracker } from "./ProductViewTracker";
import { formatVND, getPreferredInitialVariant } from "@/lib/utils";

export interface ProductDetailContentProps {
  product: Product;
  variants: Variant[];
  /** Combined images: product images then each variant's images in variant order */
  galleryImages: string[];
  /** Precomputed per slide: OOS styling for that image (product-wide or variant stock) */
  outOfStockByImageIndex: boolean[];
  /** Map variant id -> index of first image in galleryImages for that variant */
  variantFirstImageIndex: Record<string, number>;
  isSoldOut: boolean;
  isPreorder: boolean;
  isShowPreorderCountdown: boolean;
  isIncludedDescription: boolean;
}

export function ProductDetailContent({
  product,
  variants,
  galleryImages,
  outOfStockByImageIndex,
  variantFirstImageIndex,
  isSoldOut,
  isPreorder,
  isShowPreorderCountdown,
  isIncludedDescription,
}: ProductDetailContentProps) {
  const defaultVariant = getPreferredInitialVariant(variants, product);
  const [selectedVariant, setSelectedVariant] = React.useState<Variant | null>(
    defaultVariant
  );
  const [activeImageIndex, setActiveImageIndex] = React.useState(() =>
    defaultVariant ? (variantFirstImageIndex[defaultVariant.id] ?? 0) : 0
  );

  const handleVariantChange = React.useCallback(
    (v: Variant | null) => {
      setSelectedVariant(v);
      if (v) {
        const idx = variantFirstImageIndex[v.id];
        if (idx !== undefined) setActiveImageIndex(idx);
      }
    },
    [variantFirstImageIndex]
  );

  const displayPrice = selectedVariant?.price ?? product.price ?? 0;

  return (
    <div className="grid min-w-0 max-w-full gap-8 lg:grid-cols-2">
      <ProductViewTracker productId={product.id} />
      {/* LEFT: Gallery */}
      <section
        aria-label="Product images"
        className={`relative min-w-0 max-w-full self-start overflow-hidden rounded-2xl border bg-card p-4 ${
          isSoldOut ? "border-muted-foreground/30" : "border-border"
        }`}
      >
        <ProductImageSlider
          images={galleryImages}
          outOfStockByImageIndex={outOfStockByImageIndex}
          productName={product.name}
          activeIndex={activeImageIndex}
          onActiveIndexChange={setActiveImageIndex}
          imageContainerClassName="max-h-[320px] sm:max-h-[360px] lg:max-h-[380px]"
        />
      </section>

      {/* RIGHT: Info */}
      <section
        aria-label="Product info"
        className="min-w-0 max-w-full space-y-5"
      >
        <div className="flex items-center gap-2">
          {isSoldOut && (
            <span className="inline-flex items-center rounded-full border-2 border-destructive bg-destructive/15 px-4 py-1.5 text-sm font-bold text-destructive">
              Hết hàng
            </span>
          )}
          {!isSoldOut && isPreorder && (
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
              Pre-order
            </span>
          )}
          {!isSoldOut && !isPreorder && (product.stock ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
              Còn hàng
            </span>
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {product.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            👁️ {product.view_count.toLocaleString("vi-VN")} views
          </span>
          {product.seller_name && <span>Master: {product.seller_name}</span>}
        </div>

        {/* Price: updates with selected variant */}
        <div
          className={`rounded-2xl border bg-card px-6 py-4 ${
            isSoldOut
              ? "border-muted-foreground/30 bg-muted/30"
              : "border-border"
          }`}
        >
          <div className="flex items-end gap-2">
            <div
              className={`text-3xl font-bold ${
                isSoldOut ? "text-muted-foreground" : "text-primary-bold"
              }`}
            >
              {formatVND(displayPrice)}
            </div>
            {product.price_note && (
              <div className="pb-1 text-sm text-muted-foreground">
                • {product.price_note}
              </div>
            )}
          </div>
        </div>

        {!isSoldOut && isShowPreorderCountdown && (
          <PreorderCountdown
            endDate={product.preorder?.end_date ?? ""}
            startDate={product.preorder?.start_date ?? ""}
          />
        )}

        {isIncludedDescription && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Mô tả</h2>
            </div>
            <dl className="divide-y divide-border">
              {product.description && (
                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">Mô tả</dt>
                  <dd className="col-span-2 text-sm text-foreground">
                    {product.description}
                  </dd>
                </div>
              )}
              {product.size_description && (
                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">Kích thước</dt>
                  <dd className="col-span-2 text-sm text-foreground">
                    {product.size_description}
                  </dd>
                </div>
              )}
              {product.package_description && (
                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">Bao gồm</dt>
                  <dd className="col-span-2 text-sm text-foreground">
                    {product.package_description}
                  </dd>
                </div>
              )}
              {product.preorder_description && (
                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">
                    Thời gian sản xuất
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground">
                    {product.preorder_description}
                  </dd>
                </div>
              )}
              {product.shipping_note && (
                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">
                    Ghi chú giao hàng
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground">
                    {product.shipping_note}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {isSoldOut ? (
          <div
            className="rounded-2xl border-2 border-dashed border-destructive/50 bg-destructive/5 px-6 py-8 text-center"
            aria-live="polite"
          >
            <p className="text-base font-semibold text-destructive">
              Sản phẩm tạm thời hết hàng
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vui lòng kiểm tra lại sau hoặc xem các sản phẩm khác.
            </p>
          </div>
        ) : (
          <ProductCartControls
            product={product}
            variants={variants}
            basePrice={0}
            selectedVariant={selectedVariant}
            onVariantChange={handleVariantChange}
          />
        )}
      </section>
    </div>
  );
}
