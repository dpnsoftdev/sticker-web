import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/features/order/order.api";
import { Order } from "@/types/order";

export function useOrder(orderId: string) {
  return useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: () => orderApi.getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useOrderByCode(orderCode: string, email?: string) {
  return useQuery<Order>({
    queryKey: ["order", "code", orderCode, email],
    queryFn: () => orderApi.getOrderByCode(orderCode, email),
    enabled: !!orderCode,
  });
}
