import { API_ENDPOINTS } from "@/lib/constants";
import type { HomepageApiResponse, HomepageCategory } from "./homepage.types";

/** Next.js fetch cache options (use from Server Components only). */
export type HomepageFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * Fetches categories with products for the store homepage (Server Components).
 * Uses Next.js native fetch() so caching is controlled via `options.next`.
 * Categories are sorted by createdAt; each category has up to 20 products (sorted by createdAt).
 */
export async function fetchHomepage(
  options?: HomepageFetchOptions
): Promise<HomepageCategory[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const url = `${base}${API_ENDPOINTS.HOMEPAGE}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: options?.next,
  });

  if (!res.ok) {
    throw new Error(`Homepage fetch failed: ${res.status} ${res.statusText}`);
  }

  const data: HomepageApiResponse = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Failed to load homepage data");
  }
  return data.data;
}

/** @deprecated Use fetchHomepage() in Server Components for proper Next.js caching. */
export const homepageApi = {
  async getHomepage(): Promise<HomepageCategory[]> {
    return fetchHomepage();
  },
};
