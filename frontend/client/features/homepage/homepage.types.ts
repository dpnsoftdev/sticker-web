export type ProductType = "in_stock" | "preorder";

export interface HomepageProduct {
  _id: string;
  thumbnail: string;
  name: string;
  price: number | null;
  product_type: ProductType;
  slug: string;
  out_of_stock: boolean;
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  created_at?: string;
  updated_at?: string;
  products: HomepageProduct[];
}

export interface HomepageApiResponse {
  success: boolean;
  message: string;
  data: HomepageCategory[];
  statusCode: number;
}
