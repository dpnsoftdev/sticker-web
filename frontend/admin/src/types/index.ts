export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  /** Number of products in this category (from list API). */
  productCount?: number;
};

export interface AuthData {
  roles: string[];
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  // some other data...
}

export type UserRoleType = "admin" | "editor" | "user";

export type ProductType = "in_stock" | "preorder";

export type ProductStatus = "active" | "inactive" | "archived";

export type Product = {
  id: string;
  name: string;
  slug: string;
  status?: ProductStatus;
  categoryId: string;
  productType: ProductType;
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
  preorderStartsAt: string | null;
  preorderEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
};

export type Variant = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  sku: string | null;
  status?: "active" | "inactive" | "archived";
  isDefault?: boolean;
  price: number;
  stock: number;
  images: string[];
};

/** Variant payload when creating a product (no id, productId set by backend) */
export type CreateVariantInput = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  images?: string[];
  isDefault?: boolean;
};

/** Product create body: product fields + optional variants. For single product omit variants and send price/stock; backend creates a default variant. */
export type CreateProductBody = {
  name: string;
  slug: string;
  categoryId: string;
  productType: ProductType;
  status?: ProductStatus;
  currency?: string;
  priceNote?: string | null;
  shippingNote?: string | null;
  sellerName: string;
  description?: string | null;
  sizeDescription?: string | null;
  packageDescription?: string | null;
  preorderDescription?: string | null;
  images?: string[];
  preorderStartsAt?: string | null;
  preorderEndsAt?: string | null;
  variants?: CreateVariantInput[];
  /** For single-product flow: backend creates one default variant with this price/stock. */
  price?: number;
  stock?: number;
};

/** Partial product fields accepted by PUT /products/:id */
export type UpdateProductBody = Partial<Omit<CreateProductBody, "variants">>;

// --- Order (admin) ---
export type OrderStatus =
  | "pending_confirmation"
  | "payment_confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type OrderContact = {
  social_link: string;
  email: string;
  phone: string;
};

export type OrderShippingInfo = {
  receiver_name: string;
  receiver_phone?: string;
  address: string;
  notes?: string | null;
};

export type OrderPayment = {
  plan_type: "full" | "deposit";
  method: string;
  bill_image?: string | null;
};

export type OrderItemDisplay = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Snapshot from API when product relation is omitted. */
  productName?: string;
  variantName?: string | null;
  product?: { name: string; id: string };
  variant?: { name: string; id: string } | null;
};

export type OrderPromotionDisplay = {
  id: string;
  promotionId: string | null;
  promotionCode: string | null;
  discountType: string;
  discountValue: number;
  appliedAmount: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  currency?: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  /** Internal note for staff (not shown to customers). */
  adminNote?: string | null;
  contact: OrderContact;
  shippingInfo: OrderShippingInfo;
  payment: OrderPayment;
  promotions: OrderPromotionDisplay[];
  items: OrderItemDisplay[];
};

/** One order line in the product–variant aggregate API. */
export type OrderRefInVariantAggregate = {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  quantity: number;
  orderItemId: string;
};

export type ProductVariantOrderAggregate = {
  productId: string;
  variantId: string;
  productSlug: string | null;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  currency: string;
  image: string | null;
  orderCount: number;
  totalQuantity: number;
  orders: OrderRefInVariantAggregate[];
};

export type ProductVariantAggregatesListResponse = {
  data: ProductVariantOrderAggregate[];
  total: number;
};

export type {
  DashboardGrain,
  DashboardOverview,
  DashboardStatusRow,
  DashboardSummaryResponse,
  DashboardTimeBucket,
} from "./dashboard";
