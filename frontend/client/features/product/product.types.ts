import { Product, Variant, Category } from "@/types/product";

export interface ProductListParams {
  category_id?: string;
  product_type?: "in_stock" | "preorder";
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export type { Product, Variant, Category };
