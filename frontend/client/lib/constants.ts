// Application constants

export const APP_NAME = "Sticker Store";

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
  PENDING_PAYMENT: "pending_payment",
  PROCESSING: "processing",
  SHIPPED: "shipped",
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
} as const;
