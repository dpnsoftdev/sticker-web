import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchHomepage } from "@/features/homepage/homepage.api";
import type { HomepageCategory } from "@/features/homepage/homepage.types";
import { ProductCarousel } from "@/components/common/ProductCarousel";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title:
    "Dango's Corner – Stickers, Sticker Book, Văn phòng phẩm & Order nội địa Trung",
  description:
    "Dango's Corner chuyên stickers, sticker book, văn phòng phẩm, pre-order và order nội địa Trung từ Taobao, PDD, Douyin, XHS. Nhận pre-order & order theo yêu cầu.",
  keywords: [
    "stickers",
    "sticker book",
    "văn phòng phẩm",
    "pre-order stickers",
    "sticker handmade",
    "order taobao",
    "order pdd",
    "order douyin",
    "order xiaohongshu",
    "order xhs",
    "order nội địa Trung",
  ],
  openGraph: {
    title:
      "Dango's Corner – Stickers, Sticker Book, Văn phòng phẩm & Order nội địa Trung",
    description:
      "Chuyên stickers, sticker book, văn phòng phẩm, pre-order và order nội địa Trung từ Taobao, PDD, Douyin, XHS. Nhận pre-order & order theo yêu cầu.",
    url: "https://dango-sticker.vercel.app",
    siteName: "Dango's Corner",
    type: "website",
  },
};

const PLACEHOLDER_IMAGE =
  "https://d20m1ujgrryo2d.cloudfront.net/placeholder.png";

export default async function HomePage() {
  let categories: HomepageCategory[];
  try {
    categories = await fetchHomepage({
      next: { revalidate: 60 }, // 1 minute
    });
  } catch (error) {
    console.error("error", error);
    categories = [];
  }

  return (
    <main className="bg-background">
      {/* HERO / SEARCH */}
      <section className="container mx-auto text-center p-8">
        <div className="flex flex-col items-center">
          <Image
            src="/dango_icon.png"
            alt="Dango's Corner"
            width={240}
            height={240}
            className="h-30 w-auto md:h-40"
          />
          <h1 className="max-w-full font-bold text-foreground max-md:whitespace-nowrap max-md:text-[clamp(1.15rem,5.2vw,1.9rem)] md:whitespace-normal md:text-4xl">
            Tại đây chúng tôi có stickers
          </h1>
        </div>

        {/* Search (indexable placeholder) */}
        <form
          action={ROUTES.PRODUCT}
          className="mt-8 flex justify-center"
          role="search"
        >
          <input
            type="search"
            name="q"
            placeholder="Tìm kiếm sản phẩm, phân loại..."
            className="w-full max-w-xl rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
      </section>
      {categories.map(category => (
        <section
          key={category.id}
          className="container mx-auto p-8"
          aria-labelledby={category.slug}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id={category.slug}
              className="min-w-0 flex-1 pr-2 font-semibold max-md:text-[clamp(1.05rem,4.4vw,1.5rem)] md:text-2xl"
            >
              {category.name}
            </h2>

            <Link
              href={`${ROUTES.CATEGORY}/${category.slug}`}
              className="text-sm nav-link"
            >
              Xem thêm →
            </Link>
          </div>

          <ProductCarousel
            products={category.products}
            placeholderImage={PLACEHOLDER_IMAGE}
          />
        </section>
      ))}
    </main>
  );
}
