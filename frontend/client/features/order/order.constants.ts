import { ORDER_STATUS } from "@/lib/constants";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING_CONFIRMATION]: "Chờ xác nhận",
  [ORDER_STATUS.PAYMENT_CONFIRMED]: "Đã xác nhận thanh toán",
  [ORDER_STATUS.SHIPPING]: "Đang giao",
  [ORDER_STATUS.DELIVERED]: "Đã giao",
  [ORDER_STATUS.CANCELLED]: "Đã hủy",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  [ORDER_STATUS.PENDING_CONFIRMATION]: "yellow",
  [ORDER_STATUS.PAYMENT_CONFIRMED]: "blue",
  [ORDER_STATUS.SHIPPING]: "purple",
  [ORDER_STATUS.DELIVERED]: "green",
  [ORDER_STATUS.CANCELLED]: "red",
};
