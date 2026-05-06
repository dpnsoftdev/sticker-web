import { axiosPrivate } from "@apis/clientAxios";
import { API_ENDPOINTS } from "@constants";
import type {
  DashboardGrain,
  DashboardSummaryResponse,
  OrderStatus,
} from "@types";

export type DashboardSummaryParams = {
  from: string;
  to: string;
  grain?: DashboardGrain;
  statuses?: OrderStatus[];
  categoryId?: string;
  productId?: string;
  campaignId?: string;
};

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export async function fetchDashboardSummary(
  params: DashboardSummaryParams
): Promise<DashboardSummaryResponse | null> {
  const query: Record<string, string> = {
    from: params.from,
    to: params.to,
    grain: params.grain ?? "day",
  };
  if (params.statuses?.length) {
    query.statuses = params.statuses.join(",");
  }
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.productId) query.productId = params.productId;
  if (params.campaignId?.trim()) query.campaignId = params.campaignId.trim();

  const res = await axiosPrivate.get<ApiResponse<DashboardSummaryResponse>>(
    API_ENDPOINTS.DASHBOARD_SUMMARY,
    { params: query }
  );
  return res.data?.data ?? null;
}
