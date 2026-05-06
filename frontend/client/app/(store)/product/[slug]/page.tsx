import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Product } from "@/types/product";
import { ProductDetailContent } from "@/components/common/ProductDetailContent";
import { productApi } from "@/features/product/product.api";
import { PLACEHOLDER_IMAGE, ROUTES } from "@/lib/constants";
import { buildProductGallery, formatVND, isSoldOutProduct } from "@/lib/utils";

async function getRelatedProductsByCategory(
  categoryId: string | null,
  _excludeProductId: string
): Promise<Product[]> {
  if (!categoryId) return [];
  // TODO: replace with real API when list-by-category or related endpoint exists
  return [];
}

// ✅ SEO: dynamic metadata by slug/product
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let result;
  try {
    result = await productApi.getProductBySlug(slug);
  } catch {
    return { title: "Product Not Found" };
  }
  const { product } = result;

  const title = `${product.name} – Dango's Corner`;
  const description =
    product.shipping_note ||
    product.preorder_description ||
    product.size_description ||
    "Chi tiết sản phẩm tại Dango's Corner";

  return {
    title,
    description,
    alternates: {
      canonical: `${ROUTES.PRODUCT}/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let result;
  try {
    result = await productApi.getProductBySlug(slug);
  } catch {
    notFound();
  }
  const { product, variants } = result!;

  const relatedProducts = await getRelatedProductsByCategory(
    product.category_id,
    product.id
  );

  const isPreorder = product.product_type === "preorder";
  const isSoldOut = isSoldOutProduct(product);
  const isIncludedDescription =
    !!product.description ||
    !!product.size_description ||
    !!product.package_description ||
    !!product.preorder_description ||
    !!product.shipping_note;
  const isShowPreorderCountdown =
    isPreorder &&
    !!product.preorder?.start_date &&
    !!product.preorder?.end_date;

  const { galleryImages, variantFirstImageIndex, outOfStockByImageIndex } =
    buildProductGallery(product, variants);

  return (
    <main className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={ROUTES.PRODUCT}
            className="nav-link inline-flex items-center gap-2"
          >
            ← Trở về
          </Link>
        </div>

        <ProductDetailContent
          product={product}
          variants={variants}
          galleryImages={galleryImages}
          outOfStockByImageIndex={outOfStockByImageIndex}
          variantFirstImageIndex={variantFirstImageIndex}
          isSoldOut={isSoldOut}
          isPreorder={isPreorder}
          isShowPreorderCountdown={isShowPreorderCountdown}
          isIncludedDescription={isIncludedDescription}
        />

        {/* ✅ SEO: internal links section */}
        <section className="container mx-auto px-0 pt-10 flex flex-col items-center text-center">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Xem thêm sản phẩm khác
          </h2>
          <div className="mt-4">
            <Link href={ROUTES.PRODUCT} className="nav-link">
              Đi đến danh sách sản phẩm →
            </Link>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section
            className="mt-12 border-t border-border pt-10"
            aria-labelledby="related-products"
          >
            <h2
              id="related-products"
              className="text-xl font-semibold text-foreground"
            >
              Sản phẩm cùng loại
            </h2>

            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {relatedProducts.map(p => {
                const soldOut = isSoldOutProduct(p);

                return (
                  <Link
                    key={p.id}
                    href={`${ROUTES.PRODUCT}/${p.slug}`}
                    className="group relative min-w-[220px] max-w-[220px] rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
                  >
                    {/* image */}
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      <Image
                        src={p.images?.[0] ?? PLACEHOLDER_IMAGE}
                        alt={p.name}
                        fill
                        sizes="220px"
                        className={
                          soldOut ? "object-cover opacity-60" : "object-cover"
                        }
                      />

                      {/* Sold out badge (like screenshot “Hết hạn”) */}
                      {soldOut && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                          Hết hạn
                        </span>
                      )}
                    </div>

                    {/* content */}
                    <div className="mt-3 space-y-2">
                      <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                        {p.name}
                      </h3>

                      <p className="text-base font-semibold text-primary-bold">
                        {formatVND(p.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SEO: Product JSON-LD */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              image: galleryImages.filter(Boolean),
              offers: {
                "@type": "Offer",
                priceCurrency: product.currency,
                price: product.price,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `${ROUTES.PRODUCT}/${product.slug}`,
              },
            }),
          }}
        />
      </div>
    </main>
  );
}
