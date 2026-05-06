import { API_ENDPOINTS } from "@/lib/constants";
import { apiClient } from "@/lib/fetcher";
import type { Product, Variant } from "@/types/product";

/** Backend returns product with camelCase and nested variants */
interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

interface ApiVariant {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  price: number | null;
  stock: number | null;
  images: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  productType: "in_stock" | "preorder";
  currency: string;
  priceNote: string | null;
  shippingNote: string | null;
  viewCount: number;
  sellerName: string;
  description: string | null;
  sizeDescription: string | null;
  packageDescription: string | null;
  preorderDescription: string | null;
  images: string[];
  /** Backend may send camelCase from Prisma */
  preorderStartsAt?: string | null;
  preorderEndsAt?: string | null;
  preorder?: { start_date?: string; end_date?: string } | null;
  createdAt: string;
  updatedAt: string;
  variants: ApiVariant[];
}

function mapApiProductToProduct(api: ApiProduct): Product {
  const variants = api.variants ?? [];
  const defaultVariant = variants.find(v => v.isDefault) ?? variants[0] ?? null;
  const price = defaultVariant?.price ?? 0;
  const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

  const preorderFromDates =
    api.preorderStartsAt != null || api.preorderEndsAt != null
      ? {
          start_date: api.preorderStartsAt ?? "",
          end_date: api.preorderEndsAt ?? "",
        }
      : null;
  const preorderFromPayload = api.preorder as
    | { start_date?: string; end_date?: string }
    | null
    | undefined;
  const preorder =
    preorderFromDates ??
    (preorderFromPayload &&
    (preorderFromPayload.start_date != null ||
      preorderFromPayload.end_date != null)
      ? {
          start_date: preorderFromPayload.start_date ?? "",
          end_date: preorderFromPayload.end_date ?? "",
        }
      : null);

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    category_id: api.categoryId ?? null,
    product_type: api.productType,
    price,
    currency: api.currency ?? "VND",
    description: api.description ?? null,
    price_note: api.priceNote ?? null,
    shipping_note: api.shippingNote ?? null,
    stock: totalStock,
    seller_name: api.sellerName ?? null,
    size_description: api.sizeDescription ?? null,
    package_description: api.packageDescription ?? null,
    preorder_description: api.preorderDescription ?? null,
    images: Array.isArray(api.images) ? api.images : [],
    view_count: api.viewCount ?? 0,
    preorder,
    created_at: api.createdAt,
    updated_at: api.updatedAt,
  };
}

function mapApiVariantToVariant(api: ApiVariant, index: number): Variant {
  return {
    id: api.id,
    product_id: api.productId,
    name: api.name,
    description: api.description ?? null,
    price: api.price ?? null,
    stock: api.stock ?? null,
    images: api.images?.length ? api.images : null,
    is_default: api.isDefault ?? false,
    display_order: index,
    created_at: api.createdAt,
    updated_at: api.updatedAt,
  };
}

export interface ProductDetailResult {
  product: Product;
  variants: Variant[];
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ProductListParams {
  category_id?: string;
  page?: number;
  limit?: number;
  sort?: ProductSort;
  keyword?: string;
}

export interface ProductListResult {
  data: Product[];
  total: number;
}

/** For use in Server Components; fetches paginated products (e.g. by category). */
export async function fetchProductList(
  params: ProductListParams,
  options?: { next?: { revalidate?: number | false; tags?: string[] } }
): Promise<ProductListResult> {
  const searchParams = new URLSearchParams();
  if (params.category_id) searchParams.set("category_id", params.category_id);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.keyword) searchParams.set("keyword", params.keyword);

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const url = `${base}${API_ENDPOINTS.PRODUCT}?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: options?.next,
  });

  if (!res.ok) {
    throw new Error(
      `Product list fetch failed: ${res.status} ${res.statusText}`
    );
  }

  const body: ServiceResponse<{ data: ApiProduct[]; total: number }> =
    await res.json();
  if (!body.success || !body.data) {
    return { data: [], total: 0 };
  }

  const { data: list, total } = body.data;
  return {
    data: (list ?? []).map(mapApiProductToProduct),
    total: total ?? 0,
  };
}

/**
 * Best-effort: records a product detail view (Redis buffer → DB via backend cron).
 * Sends optional `viewerId` for duplicate suppression when the server uses PRODUCT_VIEW_PREVENT_DUPLICATE.
 */
export async function recordProductView(
  productId: string,
  body?: { viewerId?: string }
): Promise<void> {
  try {
    await apiClient.post<ServiceResponse<RecordProductViewResult>>(
      `${API_ENDPOINTS.PRODUCT}/${encodeURIComponent(productId)}/views`,
      body ?? {}
    );
  } catch {
    // non-blocking for UX
  }
}

interface RecordProductViewResult {
  counted: boolean;
}

export const productApi = {
  async getProductBySlug(slug: string): Promise<ProductDetailResult> {
    const res = await apiClient.get<ServiceResponse<ApiProduct>>(
      `${API_ENDPOINTS.PRODUCT_DETAIL}/${encodeURIComponent(slug)}`
    );
    const body = res.data;
    if (!body.success || !body.data) {
      throw new Error(body.message ?? "Failed to load product");
    }
    const apiProduct = body.data;
    const product = mapApiProductToProduct(apiProduct);
    const variants = (apiProduct.variants ?? []).map((v, i) =>
      mapApiVariantToVariant(v, i)
    );
    variants.sort(
      (a, b) =>
        (a.is_default ? 0 : 1) - (b.is_default ? 0 : 1) ||
        a.display_order - b.display_order
    );
    return { product, variants };
  },
};
