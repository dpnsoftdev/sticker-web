import { ORDER_STATUS } from "@/lib/constants";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: "Pending Payment",
  [ORDER_STATUS.PROCESSING]: "Processing",
  [ORDER_STATUS.SHIPPED]: "Shipped",
  [ORDER_STATUS.DELIVERED]: "Delivered",
  [ORDER_STATUS.CANCELLED]: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: "yellow",
  [ORDER_STATUS.PROCESSING]: "blue",
  [ORDER_STATUS.SHIPPED]: "purple",
  [ORDER_STATUS.DELIVERED]: "green",
  [ORDER_STATUS.CANCELLED]: "red",
};
