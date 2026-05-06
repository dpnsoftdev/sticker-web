import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import type { OrderStatus } from "@/common/lib/prisma-client";

import { buildDashboardOrderWhere, buildPrevWhere, dashboardRepository } from "./dashboardRepository";

export const dashboardService = {
  getDashboardSummary: async (params: {
    from: string;
    to: string;
    grain: "day" | "week" | "month";
    statuses?: string;
    categoryId?: string;
    productId?: string;
    campaignId?: string;
  }) => {
    const dateFrom = new Date(params.from);
    const dateTo = new Date(params.to);
    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      return ServiceResponse.failure("Invalid from or to date.", null, StatusCodes.BAD_REQUEST);
    }
    if (dateFrom > dateTo) {
      return ServiceResponse.failure("`from` must be before or equal to `to`.", null, StatusCodes.BAD_REQUEST);
    }

    const duration = dateTo.getTime() - dateFrom.getTime();
    const prevDateTo = new Date(dateFrom.getTime() - 1);
    const prevDateFrom = new Date(prevDateTo.getTime() - duration);

    const ALL_STATUSES: OrderStatus[] = [
      "pending_confirmation",
      "payment_confirmed",
      "shipping",
      "delivered",
      "cancelled",
    ];
    const statusList = params.statuses
      ? (params.statuses
          .split(",")
          .map((s) => s.trim())
          .filter((s): s is OrderStatus => ALL_STATUSES.includes(s as OrderStatus)) as OrderStatus[])
      : undefined;

    const input = {
      dateFrom,
      dateTo,
      prevDateFrom,
      prevDateTo,
      statuses: statusList,
      categoryId: params.categoryId,
      productId: params.productId,
      campaignId: params.campaignId ?? null,
      grain: params.grain,
    };

    const { where, empty } = await buildDashboardOrderWhere(input);
    const prevWhere = buildPrevWhere(where, prevDateFrom, prevDateTo);

    const emptyOverview = {
      orderCount: 0,
      gmv: 0,
      discountTotal: 0,
      netRevenue: 0,
      aov: 0,
      previous: {
        orderCount: 0,
        gmv: 0,
        discountTotal: 0,
        netRevenue: 0,
        aov: 0,
      },
      changePct: {
        orderCount: 0 as number | null,
        gmv: 0 as number | null,
        discountTotal: 0 as number | null,
        netRevenue: 0 as number | null,
        aov: 0 as number | null,
      },
    };

    if (empty) {
      const [inventory, campaigns] = await Promise.all([
        dashboardRepository.getInventorySummary(),
        dashboardRepository.getCampaignSummaries(params.campaignId ?? null),
      ]);
      return ServiceResponse.success(
        "Dashboard summary",
        {
          overview: emptyOverview,
          byStatus: [],
          timeSeries: { current: [], previous: [] },
          topProducts: [],
          topVariants: [],
          topCategories: [],
          promotions: [],
          inventory,
          campaigns,
          meta: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
            prevFrom: prevDateFrom.toISOString(),
            prevTo: prevDateTo.toISOString(),
            grain: params.grain,
            empty: true,
          },
        },
        StatusCodes.OK,
      );
    }

    const [overview, byStatus, timeSeries, topProducts, topVariants, topCategories, promotions, inventory, campaigns] =
      await Promise.all([
        dashboardRepository.getOverview(where, prevWhere),
        dashboardRepository.getByStatus(where),
        dashboardRepository.getTimeSeries(where, prevWhere, params.grain),
        dashboardRepository.getTopProducts(where, 10),
        dashboardRepository.getTopVariants(where, 10),
        dashboardRepository.getTopCategories(where, 10),
        dashboardRepository.getPromotionStats(where),
        dashboardRepository.getInventorySummary(),
        dashboardRepository.getCampaignSummaries(params.campaignId ?? null),
      ]);

    return ServiceResponse.success(
      "Dashboard summary",
      {
        overview,
        byStatus,
        timeSeries,
        topProducts,
        topVariants,
        topCategories,
        promotions,
        inventory,
        campaigns,
        meta: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          prevFrom: prevDateFrom.toISOString(),
          prevTo: prevDateTo.toISOString(),
          grain: params.grain,
          empty: false,
        },
      },
      StatusCodes.OK,
    );
  },
};
