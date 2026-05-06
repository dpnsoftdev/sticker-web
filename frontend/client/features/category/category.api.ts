import { API_ENDPOINTS } from "@/lib/constants";
import type { Category, ProductCardHomepage } from "@/types/product";

interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

/** For use in Server Components; fetches all categories. */
export async function fetchCategoryList(options?: {
  next?: { revalidate?: number | false; tags?: string[] };
}): Promise<Category[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const url = `${base}${API_ENDPOINTS.CATEGORIES}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: options?.next,
  });

  if (!res.ok) {
    throw new Error(`Categories fetch failed: ${res.status} ${res.statusText}`);
  }

  const body: ServiceResponse<Array<Record<string, unknown>>> =
    await res.json();
  if (!body.success || !Array.isArray(body.data)) return [];

  return body.data.map((raw: Record<string, unknown>) => ({
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    description: raw.description != null ? String(raw.description) : null,
    images: Array.isArray(raw.images) ? (raw.images as string[]) : null,
    created_at: String(raw.createdAt ?? ""),
    updated_at: String(raw.updatedAt ?? ""),
  }));
}

/** For use in Server Components; fetches category by slug. */
export async function fetchCategoryBySlug(
  slug: string,
  options?: { next?: { revalidate?: number | false; tags?: string[] } }
): Promise<Category | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const url = `${base}${API_ENDPOINTS.CATEGORY_BY_SLUG}/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: options?.next,
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Category fetch failed: ${res.status} ${res.statusText}`);
  }

  const body: ServiceResponse<Category & { images?: string[] }> =
    await res.json();
  if (!body.success || !body.data) return null;

  const raw = body.data as {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
  };
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? null,
    images: Array.isArray(raw.images) ? raw.images : null,
    created_at: raw.createdAt ?? "",
    updated_at: raw.updatedAt ?? "",
  };
}

export type CategoryPageSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface CategoryPageProductsParams {
  page?: number;
  limit?: number;
  sort?: CategoryPageSort;
  keyword?: string;
}

export interface CategoryPageProductsResult {
  data: ProductCardHomepage[];
  total: number;
}

/** Fetches paginated product cards for a category (slug). For use on category listing page. */
export async function fetchCategoryProducts(
  slug: string,
  params: CategoryPageProductsParams,
  options?: { next?: { revalidate?: number | false; tags?: string[] } }
): Promise<CategoryPageProductsResult> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.keyword) searchParams.set("keyword", params.keyword);

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const url = `${base}${API_ENDPOINTS.CATEGORY_PAGE}/${encodeURIComponent(slug)}/products?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: options?.next,
  });

  if (!res.ok) {
    if (res.status === 404) return { data: [], total: 0 };
    throw new Error(`Category products fetch failed: ${res.status} ${res.statusText}`);
  }

  const body: ServiceResponse<{ data: ProductCardHomepage[]; total: number }> = await res.json();
  if (!body.success || !body.data) return { data: [], total: 0 };

  const { data = [], total = 0 } = body.data;
  return { data, total };
}
