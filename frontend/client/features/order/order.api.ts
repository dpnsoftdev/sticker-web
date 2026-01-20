import { apiClient, fetcher } from "@/lib/fetcher";
import { Order, CreateOrderData, CreateOrderResponse } from "./order.types";

export const orderApi = {
  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const { data: response } = await apiClient.post<CreateOrderResponse>("/api/orders", data);
    return response;
  },

  async getOrder(orderId: string): Promise<Order> {
    return fetcher<Order>(`/api/orders/${orderId}`);
  },

  async getOrderByCode(orderCode: string, email?: string): Promise<Order> {
    const params = email ? `?email=${encodeURIComponent(email)}` : "";
    return fetcher<Order>(`/api/orders/code/${orderCode}${params}`);
  },

  async getUserOrders(): Promise<Order[]> {
    return fetcher<Order[]>("/api/orders");
  },
};
