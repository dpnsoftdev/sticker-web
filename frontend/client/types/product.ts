export type ProductType = "in_stock" | "preorder";

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string | null;
  product_type: ProductType;
  price: number;
  currency: string;
  price_note: string | null;
  shipping_note: string | null;
  stock: number;
  seller_name: string | null;
  size_description: string | null;
  package_description: string | null;
  preorder_description: string | null;
  images: string[];
  view_count: number;
  preorder: {
    start_date: string;
    end_date: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | null;
  stock: number | null;
  images: string[] | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}
