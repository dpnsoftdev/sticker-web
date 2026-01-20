export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "discount_code" | "buy_x_get_y" | "free_shipping";
  status: "active" | "inactive";
  start_date: string;
  end_date: string;
  discount_type: "percentage" | "fixed_amount" | "free_shipping";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  total_uses: number | null;
  used_count: number;
  per_user_limit: number | null;
  per_user_period: string | null;
  all_products: boolean;
  product_ids: string[];
  variant_ids: string[];
  total_discount_given: number;
  total_orders: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ValidatePromotionParams {
  code: string;
  subtotal: number;
  items: Array<{ product_id: string; variant_id?: string }>;
}

export interface ValidatePromotionResponse {
  valid: boolean;
  discount_amount: number;
  promotion?: Promotion;
  error?: string;
}
