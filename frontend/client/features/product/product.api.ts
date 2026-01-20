import { apiClient, fetcher } from "@/lib/fetcher";
import { ProductListParams, ProductListResponse, Product } from "./product.types";

export const productApi = {
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    return fetcher<ProductListResponse>("/api/products");
  },

  async getProduct(slug: string): Promise<Product> {
    return fetcher<Product>(`/api/products/${slug}`);
  },

  async getProductById(id: string): Promise<Product> {
    return fetcher<Product>(`/api/products/id/${id}`);
  },
};
