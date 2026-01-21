import type { Metadata } from "next";
import { HOME_CATEGORIES } from "@/features/product/product.mock";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Dango's Corner – Order K-pop, Doll & Handmade Merch",
  description:
    "Dango's Corner chuyên nhận order K-pop, doll, merch, sticker handmade từ Taobao, PDD, Douyin, XHS. Nhận pre-order & order theo yêu cầu.",
  keywords: [
    "order kpop",
    "preorder doll",
    "kpop merch",
    "sticker handmade",
    "order taobao",
    "order pdd",
    "order douyin",
  ],
  openGraph: {
    title: "Dango's Corner – K-pop & Handmade Merch",
    description:
      "Order K-pop, doll, merch, sticker handmade. Nhận pre-order và order theo yêu cầu.",
    url: "https://dangoscorner.com",
    siteName: "Dango's Corner",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="bg-background">
      {/* HERO / SEARCH */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Sản phẩm K-pop, Doll & Handmade Merch
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Nhận order K-pop, C-pop, Anime, doll, sticker handmade từ Taobao, PDD,
          Douyin, XHS. Hỗ trợ pre-order và order theo yêu cầu.
        </p>

        {/* Search (indexable placeholder) */}
        <form
          action="/products"
          className="mt-8 flex justify-center"
          role="search"
        >
          <input
            type="search"
            name="q"
            placeholder="Tìm kiếm sản phẩm, artist, danh mục..."
            className="w-full max-w-xl rounded-xl border border-border bg-card px-4 py-3 text-sm"
          />
        </form>
      </section>
      {HOME_CATEGORIES.map((category) => (
        <section
          key={category.id}
          className="container mx-auto px-4 py-12"
          aria-labelledby={category.slug}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id={category.slug}
              className="text-2xl font-semibold"
            >
              {category.name}
            </h2>

            <Link
              href={`/products?category=${category.slug}`}
              className="text-sm nav-link"
            >
              Xem thêm →
            </Link>
          </div>

          {/* Slider/Grid */}
          <div className="flex gap-4 overflow-x-auto">
            {category.products.map((product) => (
              <article
                key={product.id}
                className="min-w-[180px] rounded-xl bg-card p-3"
              >
                <Link href={`/products/${product.slug}`}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />

                  <h3 className="mt-2 text-sm font-medium">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-primary">
                    {product.price.toLocaleString()}đ
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

