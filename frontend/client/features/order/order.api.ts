import { apiClient } from "@/lib/fetcher";
import { API_ENDPOINTS } from "@/lib/constants";
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  ApiServiceResponse,
  OrderCreatedData,
  MyOrdersListResponse,
  MyOrderDetailResponse,
} from "./order.types";

export const orderApi = {
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post<ApiServiceResponse<OrderCreatedData>>(
      API_ENDPOINTS.ORDERS,
      payload
    );
    return data;
  },

  async listMine(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<MyOrdersListResponse> {
    const { data } = await apiClient.get<
      ApiServiceResponse<{ data: OrderCreatedData[]; total: number }>
    >(API_ENDPOINTS.ORDERS_ME, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.status ? { status: params.status } : {}),
      },
    });
    return data;
  },

  async getMine(orderId: string): Promise<MyOrderDetailResponse> {
    const { data } = await apiClient.get<ApiServiceResponse<OrderCreatedData>>(
      `${API_ENDPOINTS.ORDERS_ME}/${orderId}`
    );
    return data;
  },

  async claimGuestOrders(): Promise<
    ApiServiceResponse<{ linkedCount: number }>
  > {
    const { data } = await apiClient.post<
      ApiServiceResponse<{ linkedCount: number }>
    >(`${API_ENDPOINTS.ORDERS_ME}/claim-guest`, {});
    return data;
  },
};
