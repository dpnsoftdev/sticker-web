import type { ChipProps } from "@mui/material/Chip";

import type { OrderStatus } from "@types";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; shortLabel: string; color: ChipProps["color"] }
> = {
  pending_confirmation: {
    label: "Pending confirmation",
    shortLabel: "Pending",
    color: "warning",
  },
  payment_confirmed: {
    label: "Payment confirmed",
    shortLabel: "Paid",
    color: "info",
  },
  shipping: {
    label: "Shipping",
    shortLabel: "Shipping",
    color: "primary",
  },
  delivered: {
    label: "Delivered",
    shortLabel: "Done",
    color: "success",
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    color: "error",
  },
};

export function getStatusColor(status: OrderStatus): ChipProps["color"] {
  return ORDER_STATUS_CONFIG[status]?.color ?? "default";
}
