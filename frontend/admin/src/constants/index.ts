export const ROUTES_APP = {
  ROOT: "/",
  ADMIN: "/admin",
  AUTH: "/auth",
  PRIVATE: "/private",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  UNAUTHORIZED: "/unauthorized",
  ACCOUNT: "account",
  DASHBOARD: "/dashboard",
  CATEGORIES: "/categories",
  /** Demand per product–variant across orders. */
  ORDER_PRODUCTS: "/order-products",
};

export const API_ENDPOINTS = {
  PRESIGNED_UPLOAD: "/assets/presigned-upload",
  ASSET_DELETE: "/assets/delete",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
  CATEGORIES: "/categories",
  CATEGORIES_CREATE: "/categories/create",
  PRODUCTS: "/products",
  VARIANTS: "/variants",
  ORDERS: "/orders",
  ORDER_PRODUCT_VARIANT_AGGREGATES: "/orders/product-variant-aggregates",
  DASHBOARD_SUMMARY: "/admin/dashboard/summary",
};

// Roles id defined in database
export const ROLES = {
  ADMIN: 202,
  EDITOR: 203,
  USER: 204,
  ACCESS_ALL: 205,
};

export const ROLES_NAME = {
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
  ACCESS_ALL: "*",
};

export const DEFAULT_MAX_FILE_SIZE_MB = 5;
export const DEFAULT_MAX_FILES = 10;
export const DEFAULT_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
export const DEFAULT_PREFIX = "tmp";

/** Toast after each presigned upload to tmp — user must save to move files to the product. */
export const PRESIGNED_TMP_UPLOAD_SUCCESS =
  "Uploaded to temporary storage. Save to apply changes.";

export const PRODUCTS_PREFIX = "products";
export const CATEGORIES_PREFIX = "categories";
export const MAX_PRODUCT_IMAGES = 10;

export const MAX_VARIANT_IMAGES = 5;
export const MIN_VARIANT_IMAGES = 1;
