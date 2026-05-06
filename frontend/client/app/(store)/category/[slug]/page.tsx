import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fetchCategoryBySlug,
  fetchCategoryList,
  fetchCategoryProducts,
  type CategoryPageSort,
} from "@/features/category/category.api";
import { CategoryFilterSelect } from "@/components/common/CategoryFilterSelect";
import { CategorySortSelect } from "@/components/common/CategorySortSelect";
import { ROUTES } from "@/lib/constants";
import { ProductCard } from "@/components/common/ProductCard";

const DEFAULT_PAGE_SIZE = 12;
const VALID_SORT: CategoryPageSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

function parseSort(sort: string | undefined): CategoryPageSort {
  if (sort && VALID_SORT.includes(sort as CategoryPageSort))
    return sort as CategoryPageSort;
  return "newest";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: "Danh mục không tồn tại" };

  const title = `${category.name} – Dango's Corner`;
  const description =
    category.description ||
    `Khám phá các sản phẩm ${category.name.toLowerCase()} tại Dango's Corner.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${ROUTES.CATEGORY}/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${ROUTES.CATEGORY}/${category.slug}`,
      type: "website",
    },
  };
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;

  const [category, categories] = await Promise.all([
    fetchCategoryBySlug(slug, { next: { revalidate: 60 } }),
    fetchCategoryList({ next: { revalidate: 60 } }),
  ]);
  if (!category) notFound();

  const page = Math.max(1, parseInt(resolvedSearch.page ?? "1", 10) || 1);
  const sort = parseSort(resolvedSearch.sort);
  const keyword = (resolvedSearch.q ?? "").trim() || undefined;

  const { data: products, total } = await fetchCategoryProducts(
    slug,
    {
      page,
      limit: DEFAULT_PAGE_SIZE,
      sort,
      keyword,
    },
    { next: { revalidate: 60 } }
  );

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const baseUrl = `${ROUTES.CATEGORY}/${slug}`;
  function buildPageUrl(pageNum: number) {
    const p = new URLSearchParams();
    if (pageNum > 1) p.set("page", String(pageNum));
    if (sort && sort !== "newest") p.set("sort", sort);
    if (keyword) p.set("q", keyword);
    const q = p.toString();
    return q ? `${baseUrl}?${q}` : baseUrl;
  }

  const canonicalUrl = `${ROUTES.CATEGORY}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description:
      category.description ||
      `Khám phá các sản phẩm ${category.name.toLowerCase()} tại Dango's Corner.`,
    url: canonicalUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: products.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: `${ROUTES.PRODUCT}/${p.slug}`,
        },
      })),
    },
  };

  return (
    <main className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href={ROUTES.PRODUCT}
            className="nav-link inline-flex items-center gap-2"
          >
            ← Quay lại trang sản phẩm
          </Link>
        </div>

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {category.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Khám phá các sản phẩm {category.name.toLowerCase()}
          </p>
        </header>

        {/* Search */}
        <form
          action={baseUrl}
          method="get"
          className="flex justify-center mb-6"
          role="search"
        >
          <input type="hidden" name="sort" value={sort} />
          <div className="relative w-full max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              name="q"
              defaultValue={keyword}
              placeholder="Tìm kiếm sản phẩm, phân loại..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        {/* Filters row — single line on all breakpoints; md+ keeps spaced 220px controls */}
        <div className="mb-6 flex flex-nowrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="min-w-0 flex-1 md:w-[220px] md:flex-none">
            <Suspense
              fallback={
                <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
              }
            >
              <CategoryFilterSelect
                categories={categories}
                currentSlug={category.slug}
              />
            </Suspense>
          </div>
          <div className="min-w-0 flex-1 md:w-[220px] md:flex-none">
            <Suspense
              fallback={
                <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
              }
            >
              <CategorySortSelect currentSort={sort} />
            </Suspense>
          </div>
        </div>

        {/* Product grid */}
        <section
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          aria-label="Danh sách sản phẩm"
        >
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </section>

        {products.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">
            Không tìm thấy sản phẩm nào.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-4 mt-10 pt-6 border-t border-border"
            aria-label="Phân trang"
          >
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Trước
              </Link>
            ) : (
              <span
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground/60 cursor-not-allowed"
                aria-disabled="true"
              >
                Trước
              </span>
            )}

            <span className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Sau
              </Link>
            ) : (
              <span
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground/60 cursor-not-allowed"
                aria-disabled="true"
              >
                Sau
              </span>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
