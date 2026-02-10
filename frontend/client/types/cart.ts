export interface CartItem {
  cartItemId: string; // productId::variantId (or default)
  productId: string;
  variantId?: string;
  quantity: number;
  productName?: string;
  variantName?: string;
  price?: number;
  campaignPrice?: number;
  image?: string;
}
