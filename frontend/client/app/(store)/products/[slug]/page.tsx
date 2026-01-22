import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import type { Product, Variant } from "@/types/product"; // chỉnh path đúng project bạn
import VariantSelector from "@/components/common/variant-selector";
import AddToCartBar from "@/components/common/add-to-cart-bar";

// ✅ mock fetch (thay bằng product.api.ts của bạn sau)
async function getProductBySlug(slug: string): Promise<{
  product: Product;
  variants: Variant[];
}> {
  // TODO: replace with real API call
  const product: Product = {
    id: "prd_002",
    sku: "DOLL-NIKI",
    name: "[NI-KI] Nilili 尼粒粒",
    slug,
    category_id: "cat_doll",
    product_type: "preorder",
    price: 210000,
    currency: "VND",
    price_note: "Chưa full phí",
    shipping_note: null,
    stock: 999,
    seller_name: "Nimilya (xhs)",
    size_description: "10cm - body in đầu to",
    package_description: "1 only doll",
    preorder_description: "3–4 tháng",
    images: [
      "https://i.imgur.com/3REtmaR.jpeg",
      "https://i.imgur.com/3REtmaR.jpeg",
    ],
    view_count: 32,
    preorder: { start_date: "2024-03-01", end_date: "2024-03-10" },
    created_at: "2024-02-02",
    updated_at: "2024-02-02",
  };

  const variants: Variant[] = [
    {
      id: "var_1",
      product_id: product.id,
      sku: "DOLL-NIKI-A",
      name: "Full set",
      description: "Bao gồm doll + phụ kiện",
      price: 0,
      stock: 999,
      images: null,
      display_order: 1,
      created_at: "2024-02-02",
      updated_at: "2024-02-02",
    },
    {
      id: "var_2",
      product_id: product.id,
      sku: "DOLL-NIKI-B",
      name: "Only doll",
      description: "Chỉ doll",
      price: -20000,
      stock: 999,
      images: null,
      display_order: 2,
      created_at: "2024-02-02",
      updated_at: "2024-02-02",
    },
  ];

  return {
    product,
    variants: variants.sort((a, b) => a.display_order - b.display_order),
  };
}

async function getRelatedProductsByCategory(
  categoryId: string | null,
  excludeProductId: string
): Promise<Product[]> {
  if (!categoryId) return [];

  // TODO: replace with real API call
  const related: Product[] = [
    {
      id: "prd_rel_1",
      sku: "DOLL-NIKI-DUCK",
      name: "[NI-KI] Nishimura Duck 尼西木鸭",
      slug: "niki-nishimura-duck",
      category_id: categoryId,
      product_type: "preorder",
      price: 236000,
      currency: "VND",
      price_note: null,
      shipping_note: null,
      stock: 0,
      seller_name: null,
      size_description: null,
      package_description: null,
      preorder_description: null,
      images: ["https://i.imgur.com/3REtmaR.jpeg"],
      view_count: 12,
      preorder: { start_date: "2024-02-01", end_date: "2024-02-05" }, // hết hạn
      created_at: "2024-02-01",
      updated_at: "2024-02-01",
    },
  ];

  return related.filter(p => p.id !== excludeProductId).slice(0, 10);
}

function isPreorderExpired(p: Product) {
  if (p.product_type !== "preorder" || !p.preorder?.end_date) return false;
  const end = new Date(p.preorder.end_date);
  // so sánh theo thời gian hiện tại (server time)
  return end.getTime() < Date.now();
}

function isSoldOut(p: Product) {
  // in_stock mà stock <= 0, hoặc preorder hết hạn
  if (p.product_type === "in_stock") return (p.stock ?? 0) <= 0;
  return isPreorderExpired(p);
}

function formatVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

// ✅ SEO: dynamic metadata by slug/product
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { product } = await getProductBySlug(params.slug);

  const title = `${product.name} – Dango Corner`;
  const description =
    product.shipping_note ||
    product.preorder_description ||
    product.size_description ||
    "Chi tiết sản phẩm tại Dango Corner.";

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
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
  params: { slug: string };
}) {
  const { product, variants } = await getProductBySlug(params.slug);

  const relatedProducts = await getRelatedProductsByCategory(
    product.category_id,
    product.id
  );

  const isPreorder = product.product_type === "preorder";

  return (
    <main className="bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb / Back */}
        <div className="mb-6">
          <Link
            href="/products"
            className="nav-link inline-flex items-center gap-2"
          >
            ← Quay lại
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT: Gallery */}
          <section
            aria-label="Hình ảnh sản phẩm"
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* thumbs (SEO-friendly: still images) */}
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {product.images.map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border"
                    aria-label={`Ảnh ${idx + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`${product.name} - ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: Info */}
          <section aria-label="Thông tin sản phẩm" className="space-y-5">
            {/* badges */}
            <div className="flex items-center gap-2">
              {isPreorder && (
                <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
                  Pre-order
                </span>
              )}
              {!isPreorder && product.stock > 0 && (
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  In stock
                </span>
              )}
            </div>

            {/* ✅ SEO: H1 product name */}
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                👁️ {product.view_count.toLocaleString("vi-VN")} lượt xem
              </span>
              {product.seller_name && (
                <span>Master: {product.seller_name}</span>
              )}
            </div>

            {/* price block */}
            <div className="rounded-2xl border border-border bg-card px-6 py-4">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-primary">
                  {formatVND(product.price)}
                </div>
                {product.price_note && (
                  <div className="pb-1 text-sm text-muted-foreground">
                    • {product.price_note}
                  </div>
                )}
              </div>
            </div>

            {/* details table */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Mô tả</h2>
              </div>

              <dl className="divide-y divide-border">
                {product.size_description && (
                  <div className="grid grid-cols-3 gap-4 px-5 py-4">
                    <dt className="text-sm text-muted-foreground">
                      Kích thước
                    </dt>
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
                      Thời gian SX
                    </dt>
                    <dd className="col-span-2 text-sm text-foreground">
                      {product.preorder_description}
                    </dd>
                  </div>
                )}
                {product.shipping_note && (
                  <div className="grid grid-cols-3 gap-4 px-5 py-4">
                    <dt className="text-sm text-muted-foreground">Ghi chú</dt>
                    <dd className="col-span-2 text-sm text-foreground">
                      {product.shipping_note}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Variant selector (CLIENT) */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Phân loại
              </h2>
              <VariantSelector variants={variants} basePrice={product.price} />
            </div>

            {/* Add to cart (CLIENT) */}
            <AddToCartBar product={product} variants={variants} />
          </section>
        </div>

        {/* ✅ SEO: internal links section */}
        <section className="container mx-auto px-0 pt-10 flex flex-col items-center text-center">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Xem thêm sản phẩm khác
          </h2>
          <div className="mt-4">
            <Link href="/products" className="nav-link">
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
                const soldOut = isSoldOut(p);

                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group relative min-w-[220px] max-w-[220px] rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
                  >
                    {/* image */}
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      <Image
                        src={p.images?.[0] ?? "/images/placeholder.png"}
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

                      <p className="text-base font-semibold text-primary">
                        {formatVND(p.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ✅ SEO: Product JSON-LD */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              sku: product.sku,
              image: product.images,
              offers: {
                "@type": "Offer",
                priceCurrency: product.currency,
                price: product.price,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `/products/${product.slug}`,
              },
            }),
          }}
        />
      </div>
    </main>
  );
}
