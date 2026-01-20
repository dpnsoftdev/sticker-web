export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "preorder" | "flash_sale" | "promotion";
  status: "active" | "ended" | "cancelled";
  start_date: string;
  end_date: string;
  banner_image: string | null;
  thumbnail_image: string | null;
  allow_over_stock: boolean;
  max_quantity_per_order: number | null;
  require_deposit: boolean;
  deposit_percentage: number | null;
  estimated_delivery_date: string | null;
  delivery_note: string | null;
  total_orders: number;
  total_revenue: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignItem {
  id: string;
  campaign_id: string;
  product_id: string | null;
  variant_id: string | null;
  campaign_price: number;
  campaign_stock: number | null;
  campaign_image: string | null;
}
