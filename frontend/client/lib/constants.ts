import { NavItem } from "@/types/layout";

// Application constants
export const APP_NAME = "Dango's Corner";

// Database roles (stored in database)
export const DB_ROLES = {
  OWNER: "owner",
  CUSTOMER: "customer",
} as const;

// Application roles (used in frontend logic)
export const ROLES = {
  GUEST: "GUEST",
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export const ORDER_STATUS = {
  PENDING_CONFIRMATION: "pending_confirmation",
  PAYMENT_CONFIRMED: "payment_confirmed",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const PRODUCT_TYPE = {
  IN_STOCK: "in_stock",
  PREORDER: "preorder",
} as const;

export const CAMPAIGN_TYPE = {
  PREORDER: "preorder",
  FLASH_SALE: "flash_sale",
  PROMOTION: "promotion",
} as const;

export const PAYMENT_PLAN = {
  FULL: "full",
  DEPOSIT: "deposit",
} as const;

export const PAYMENT_METHOD = {
  BANK_TRANSFER: "bank_transfer",
  MOMO: "momo",
  ZALOPAY: "zalopay",
  PAYPAL: "paypal",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  CATEGORY: "/category",
  PRODUCT: "/product",
  PRODUCT_DETAIL: "/product/:slug",
  CART: "/cart",
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: "/checkout/success",
  CAMPAIGNS: "/campaigns",
  POLICY: "/policy",
  CONTACT: "/contact",
  ORDER_TRACK: "/order/track",
  ADMIN: "/admin",
  USER: "/user",
  /** Logged-in order history (route group `(user)/orders`) */
  MY_ORDERS: "/orders",
};

/** SessionStorage key set only after order is created; success page requires it to render. */
export const CHECKOUT_SUCCESS_SESSION_KEY = "checkout__success__session";

/** localStorage: stable anonymous id for product view deduplication when backend enables PRODUCT_VIEW_PREVENT_DUPLICATE. */
export const PRODUCT_VIEWER_ID_STORAGE_KEY = "product_view_viewer_id";

export const NAV_ITEMS: NavItem[] = [
  { label: "Sản phẩm", href: ROUTES.PRODUCT, status: "active" },
  { label: "Đăng bán", href: ROUTES.CAMPAIGNS, status: "disabled" },
  { label: "Chính sách", href: ROUTES.POLICY, status: "active" },
  { label: "Thông tin", href: ROUTES.CONTACT, status: "active" },
  { label: "Tra đơn", href: ROUTES.ORDER_TRACK, status: "active" },
];

export const API_ENDPOINTS = {
  HOMEPAGE: "/homepage",
  PRODUCT: "/products",
  PRODUCT_DETAIL: "/products/slug",
  CATEGORIES: "/categories",
  CATEGORY_BY_SLUG: "/categories/slug",
  CATEGORY_PAGE: "/category-page",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  /** Authenticated: GET list / GET one — `/orders/me`, `/orders/me/:orderId` */
  ORDERS_ME: "/orders/me",
  ORDER_TRACK_CHECK_PHONE: "/orders/track/check-phone",
  ORDER_TRACK_VERIFY_PHONE_AUTH: "/orders/track/verify-phone-auth",
  ORDER_TRACK_REQUEST_EMAIL_OTP: "/orders/track/request-email-otp",
  ORDER_TRACK_VERIFY_EMAIL_OTP: "/orders/track/verify-email-otp",
  CAMPAIGNS: "/campaigns",
  POLICY: "/policy",
  CONTACT: "/contact",
  ORDER_TRACK: "/order/track",
};

export const PLACEHOLDER_IMAGE =
  "https://d20m1ujgrryo2d.cloudfront.net/placeholder.png";

export const BILL_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
