/** Payload for POST /orders - matches backend CreateOrderBody */
export interface CreateOrderPayload {
  contact: {
    social_link: string;
    email: string;
    phone: string;
  };
  shippingInfo: {
    receiver_name: string;
    receiver_phone?: string;
    address: string;
    notes?: string | null;
  };
  payment: {
    plan_type: "full" | "deposit";
    method: string;
    bill_image?: string | null;
  };
  /** Optional promotion/discount code (e.g. "SUMMER10") - backend validates and applies */
  promotionCode?: string | null;
  /** Cart subtotal before discount (e.g. in VND) */
  subtotalAmount: number;
  /** Total discount applied (e.g. in VND) */
  discountAmount: number;
  /** Amount to pay: subtotalAmount - discountAmount, then apply plan_type (full/deposit) */
  finalAmount: number;
  /** At least one item; each must have productId, variantId (required by API), quantity */
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
}

/** Backend service response wrapper */
export interface ApiServiceResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

/** Order promotion snapshot as returned from API */
export interface OrderPromotionData {
  id: string;
  promotionId: string | null;
  promotionCode: string | null;
  discountType: string;
  discountValue: number;
  appliedAmount: number;
}

/** Order item as returned from API (snapshot from create/get order) */
export interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  currency: string;
  image: string | null;
  createdAt: string;
}

/** Order as returned from API (camelCase) - matches backend response */
export interface OrderCreatedData {
  id: string;
  /** Set when the order was placed while logged in; guest orders stay null. */
  userId?: string | null;
  status: string;
  createdAt: string;
  currency?: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  contact: Record<string, unknown>;
  shippingInfo: Record<string, unknown>;
  payment: Record<string, unknown>;
  promotions: OrderPromotionData[];
  items: OrderItemData[];
}

export type CreateOrderResponse = ApiServiceResponse<OrderCreatedData>;

export type MyOrdersListResponse = ApiServiceResponse<{
  data: OrderCreatedData[];
  total: number;
}>;

export type MyOrderDetailResponse = ApiServiceResponse<OrderCreatedData>;

export type ClaimGuestOrdersResponse = ApiServiceResponse<{
  linkedCount: number;
}>;
