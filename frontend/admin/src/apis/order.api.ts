import { axiosPrivate } from "@apis/clientAxios";
import { API_ENDPOINTS } from "@constants";
import type {
  Order,
  OrderStatus,
  ProductVariantAggregatesListResponse,
} from "@types";

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  keyword?: string;
}

export interface ProductVariantAggregatesParams {
  page?: number;
  limit?: number;
  excludeCancelled?: boolean;
  keyword?: string;
  orderStatus?: OrderStatus;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export async function fetchOrders(
  params?: OrderListParams
): Promise<OrderListResponse> {
  const res = await axiosPrivate.get<ApiResponse<OrderListResponse>>(
    API_ENDPOINTS.ORDERS,
    { params }
  );
  const payload = res.data?.data;
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "total" in payload
  )
    return payload as OrderListResponse;
  return { data: [], total: 0 };
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const res = await axiosPrivate.get<ApiResponse<Order>>(
    `${API_ENDPOINTS.ORDERS}/${id}`
  );
  return res.data?.data ?? null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  const res = await axiosPrivate.patch<ApiResponse<Order>>(
    `${API_ENDPOINTS.ORDERS}/${id}/status`,
    { status }
  );
  return (res.data?.data ?? res.data) as Order;
}

export async function updateOrderAdminNote(
  id: string,
  adminNote: string | null
): Promise<Order> {
  const res = await axiosPrivate.patch<ApiResponse<Order>>(
    `${API_ENDPOINTS.ORDERS}/${id}/admin-note`,
    { adminNote }
  );
  return (res.data?.data ?? res.data) as Order;
}

export async function fetchProductVariantAggregates(
  params?: ProductVariantAggregatesParams
): Promise<ProductVariantAggregatesListResponse> {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
  };
  if (params?.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params?.orderStatus) query.orderStatus = params.orderStatus;
  if (params?.excludeCancelled === false) query.excludeCancelled = "false";

  const res = await axiosPrivate.get<
    ApiResponse<ProductVariantAggregatesListResponse>
  >(API_ENDPOINTS.ORDER_PRODUCT_VARIANT_AGGREGATES, { params: query });
  const payload = res.data?.data;
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "total" in payload
  ) {
    return payload as ProductVariantAggregatesListResponse;
  }
  return { data: [], total: 0 };
}
