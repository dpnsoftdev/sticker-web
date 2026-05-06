import { OrderStatus, PromotionType } from "../lib/prisma-client";
import { UserRole } from "../types";

export const S3_PREFIX_FOLDERS = {
  TMP: "tmp",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  BILLS: "bills",
};

export const USER_ROLES: Record<string, UserRole> = {
  OWNER: "owner",
  ADMIN: "admin",
  CUSTOMER: "customer",
};

/** Stock reservation TTL: reservations expire after this many minutes if not confirmed. */
export const RESERVATION_TTL_MINUTES = 30;

export const ORDER_STATUS: Record<string, OrderStatus> = {
  PENDING_CONFIRMATION: "pending_confirmation",
  PAYMENT_CONFIRMED: "payment_confirmed",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const PROMOTION_TYPE: Record<string, PromotionType> = {
  FIXED_AMOUNT: "fixed_amount",
  PERCENTAGE: "percentage",
};

export const OTP_MESSAGES = {
  // error messages
  RATE_LIMIT: "You have reached the maximum number of OTP requests.",
  VERIFY_LOCKOUT: "Too many incorrect verification attempts.",
  NO_ORDER_FOR_PHONE: "No order was found for this phone number.",
  NO_ORDER_FOR_EMAIL: "No order was found for this email address.",
  VERIFY_FAILED: "Invalid verification code.",
  /** Email track: session invalidated after max wrong OTP attempts; user must contact support. */
  ORDER_TRACK_EMAIL_OTP_LOCKED:
    "Too many incorrect verification attempts. Please contact the shop administrator for assistance.",
  /** Active OTP missing (expired TTL or session replaced). Wrong-attempt counter is reset for the next code. */
  OTP_SESSION_EXPIRED_OR_MISSING:
    "This verification code has expired or is no longer valid. Please request a new code.",
  FAILED_TO_SEND_SMS: "Failed to send verification SMS.",
  UNABLE_TO_PROCESS_REQUEST_OTP: "Unable to process your request OTP.",

  // success messages
  VERIFICATION_CODE_SENT: "Verification code sent.",
  /** Email order-track: OTP email dispatched. */
  ORDER_TRACK_EMAIL_CODE_SENT: "Verification code has been sent to your email.",
  VERIFIED_SUCCESS: "Verified.",
};
