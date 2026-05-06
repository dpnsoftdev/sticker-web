import type { OrderStatus, Prisma } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";

export type DashboardGrain = "day" | "week" | "month";

export type DashboardQueryInput = {
  dateFrom: Date;
  dateTo: Date;
  prevDateFrom: Date;
  prevDateTo: Date;
  statuses?: OrderStatus[];
  categoryId?: string;
  productId?: string;
  campaignId?: string | null;
  grain: DashboardGrain;
};

const LOW_STOCK_THRESHOLD = 5;

function intersectRange(a: Date, b: Date, c: Date, d: Date): { from: Date; to: Date } | null {
  const from = new Date(Math.max(a.getTime(), c.getTime()));
  const to = new Date(Math.min(b.getTime(), d.getTime()));
  if (from > to) return null;
  return { from, to };
}

async function loadCampaignForFilter(campaignId: string) {
  return prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      slug: true,
      startDate: true,
      endDate: true,
      items: {
        select: {
          productId: true,
          variantId: true,
          campaignStock: true,
          stockOnHand: true,
        },
      },
    },
  });
}

export type CampaignFilterMeta = NonNullable<Awaited<ReturnType<typeof loadCampaignForFilter>>>;

/** Prisma where for orders matching dashboard filters (optional campaign = heuristic on SKU + date window). */
export async function buildDashboardOrderWhere(input: DashboardQueryInput): Promise<{
  where: Prisma.OrderWhereInput;
  campaign: CampaignFilterMeta | null;
  empty: boolean;
}> {
  let dateFrom = input.dateFrom;
  let dateTo = input.dateTo;
  let campaign: CampaignFilterMeta | null = null;

  if (input.campaignId) {
    campaign = await loadCampaignForFilter(input.campaignId);
    if (!campaign) {
      return { where: { id: { in: [] } }, campaign: null, empty: true };
    }
    const r = intersectRange(input.dateFrom, input.dateTo, campaign.startDate, campaign.endDate);
    if (!r) {
      return { where: { id: { in: [] } }, campaign, empty: true };
    }
    dateFrom = r.from;
    dateTo = r.to;
  }

  const where: Prisma.OrderWhereInput = {
    createdAt: { gte: dateFrom, lte: dateTo },
  };

  if (input.statuses?.length) {
    where.status = { in: input.statuses };
  }

  const itemAnd: Prisma.OrderItemWhereInput[] = [];
  if (input.productId) {
    itemAnd.push({ productId: input.productId });
  } else if (input.categoryId) {
    itemAnd.push({ product: { categoryId: input.categoryId } });
  }
  if (campaign?.items.length) {
    itemAnd.push({
      OR: campaign.items.map((ci) => ({
        productId: ci.productId,
        variantId: ci.variantId,
      })),
    });
  }
  if (itemAnd.length) {
    where.items = { some: { AND: itemAnd } };
  }

  return { where, campaign, empty: false };
}

export function buildPrevWhere(base: Prisma.OrderWhereInput, prevFrom: Date, prevTo: Date): Prisma.OrderWhereInput {
  return {
    ...base,
    createdAt: { gte: prevFrom, lte: prevTo },
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function startOfWeekUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}

function bucketKey(createdAt: Date, grain: DashboardGrain): string {
  const d = new Date(createdAt);
  if (grain === "day") {
    return d.toISOString().slice(0, 10);
  }
  if (grain === "week") {
    const s = startOfWeekUtc(d);
    return `W-${s.toISOString().slice(0, 10)}`;
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const dashboardRepository = {
  async getOverview(where: Prisma.OrderWhereInput, prevWhere: Prisma.OrderWhereInput) {
    const [curr, prev] = await Promise.all([
      prisma.order.aggregate({
        where,
        _count: true,
        _sum: {
          subtotalAmount: true,
          discountAmount: true,
          finalAmount: true,
        },
      }),
      prisma.order.aggregate({
        where: prevWhere,
        _count: true,
        _sum: {
          subtotalAmount: true,
          discountAmount: true,
          finalAmount: true,
        },
      }),
    ]);

    const orderCount = curr._count;
    const gmv = curr._sum.subtotalAmount ?? 0;
    const discountTotal = curr._sum.discountAmount ?? 0;
    const netRevenue = curr._sum.finalAmount ?? 0;
    const aov = orderCount > 0 ? netRevenue / orderCount : 0;

    const pOrderCount = prev._count;
    const pGmv = prev._sum.subtotalAmount ?? 0;
    const pDiscount = prev._sum.discountAmount ?? 0;
    const pNet = prev._sum.finalAmount ?? 0;
    const pAov = pOrderCount > 0 ? pNet / pOrderCount : 0;

    return {
      orderCount,
      gmv,
      discountTotal,
      netRevenue,
      aov,
      previous: {
        orderCount: pOrderCount,
        gmv: pGmv,
        discountTotal: pDiscount,
        netRevenue: pNet,
        aov: pAov,
      },
      changePct: {
        orderCount: pctChange(orderCount, pOrderCount),
        gmv: pctChange(gmv, pGmv),
        discountTotal: pctChange(discountTotal, pDiscount),
        netRevenue: pctChange(netRevenue, pNet),
        aov: pctChange(aov, pAov),
      },
    };
  },

  async getByStatus(where: Prisma.OrderWhereInput) {
    const rows = await prisma.order.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: { finalAmount: true, subtotalAmount: true },
    });
    return rows.map((r) => ({
      status: r.status,
      orderCount: r._count,
      netRevenue: r._sum.finalAmount ?? 0,
      gmv: r._sum.subtotalAmount ?? 0,
    }));
  },

  async getTimeSeries(where: Prisma.OrderWhereInput, prevWhere: Prisma.OrderWhereInput, grain: DashboardGrain) {
    const [currOrders, prevOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          createdAt: true,
          finalAmount: true,
          subtotalAmount: true,
          discountAmount: true,
        },
      }),
      prisma.order.findMany({
        where: prevWhere,
        select: {
          createdAt: true,
          finalAmount: true,
          subtotalAmount: true,
          discountAmount: true,
        },
      }),
    ]);

    const fold = (
      orders: { createdAt: Date; finalAmount: number; subtotalAmount: number; discountAmount: number }[],
    ) => {
      const map = new Map<string, { orderCount: number; gmv: number; discount: number; net: number }>();
      for (const o of orders) {
        const key = bucketKey(o.createdAt, grain);
        const row = map.get(key) ?? { orderCount: 0, gmv: 0, discount: 0, net: 0 };
        row.orderCount += 1;
        row.gmv += o.subtotalAmount;
        row.discount += o.discountAmount;
        row.net += o.finalAmount;
        map.set(key, row);
      }
      return Array.from(map.entries())
        .map(([bucket, v]) => ({
          bucket,
          orderCount: v.orderCount,
          gmv: v.gmv,
          discount: v.discount,
          netRevenue: v.net,
        }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket));
    };

    return {
      current: fold(currOrders),
      previous: fold(prevOrders),
    };
  },

  async getTopProducts(where: Prisma.OrderWhereInput, limit: number) {
    const items = await prisma.orderItem.findMany({
      where: { order: where },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        unitPrice: true,
      },
    });
    const map = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
    for (const li of items) {
      const row = map.get(li.productId) ?? {
        productId: li.productId,
        productName: li.productName,
        quantity: 0,
        revenue: 0,
      };
      row.quantity += li.quantity;
      row.revenue += li.unitPrice * li.quantity;
      map.set(li.productId, row);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  async getTopVariants(where: Prisma.OrderWhereInput, limit: number) {
    const items = await prisma.orderItem.findMany({
      where: { order: where },
      select: {
        productId: true,
        productName: true,
        variantId: true,
        variantName: true,
        quantity: true,
        unitPrice: true,
      },
    });
    const map = new Map<
      string,
      {
        variantId: string;
        productId: string;
        productName: string;
        variantName: string | null;
        quantity: number;
        revenue: number;
      }
    >();
    for (const li of items) {
      const key = li.variantId;
      const row = map.get(key) ?? {
        variantId: li.variantId,
        productId: li.productId,
        productName: li.productName,
        variantName: li.variantName,
        quantity: 0,
        revenue: 0,
      };
      row.quantity += li.quantity;
      row.revenue += li.unitPrice * li.quantity;
      map.set(key, row);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  async getTopCategories(where: Prisma.OrderWhereInput, limit: number) {
    const items = await prisma.orderItem.findMany({
      where: { order: where },
      select: {
        quantity: true,
        unitPrice: true,
        product: { select: { categoryId: true, category: { select: { id: true, name: true } } } },
      },
    });
    const map = new Map<string, { categoryId: string; categoryName: string; quantity: number; revenue: number }>();
    for (const li of items) {
      const cid = li.product.categoryId;
      const name = li.product.category?.name ?? "—";
      const row = map.get(cid) ?? { categoryId: cid, categoryName: name, quantity: 0, revenue: 0 };
      row.quantity += li.quantity;
      row.revenue += li.unitPrice * li.quantity;
      map.set(cid, row);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  /** Revenue per promotion; order revenue counted once per order per promotion. */
  async getPromotionStats(where: Prisma.OrderWhereInput) {
    const rows = await prisma.orderPromotion.findMany({
      where: { order: where },
      select: {
        promotionId: true,
        promotionCode: true,
        appliedAmount: true,
        orderId: true,
        order: { select: { finalAmount: true } },
      },
    });

    type Agg = {
      promotionId: string | null;
      promotionCode: string | null;
      redemptionLines: number;
      totalDiscount: number;
      orderRevenue: number;
      orderIds: Set<string>;
    };
    const byPromo = new Map<string, Agg>();

    for (const r of rows) {
      const key = r.promotionId ?? `code:${r.promotionCode ?? "unknown"}`;
      let agg = byPromo.get(key);
      if (!agg) {
        agg = {
          promotionId: r.promotionId,
          promotionCode: r.promotionCode,
          redemptionLines: 0,
          totalDiscount: 0,
          orderRevenue: 0,
          orderIds: new Set(),
        };
        byPromo.set(key, agg);
      }
      agg.redemptionLines += 1;
      agg.totalDiscount += r.appliedAmount;
      if (!agg.orderIds.has(r.orderId)) {
        agg.orderIds.add(r.orderId);
        agg.orderRevenue += r.order.finalAmount;
      }
    }

    return Array.from(byPromo.values()).map(({ orderIds, redemptionLines, ...rest }) => ({
      ...rest,
      redemptionLines,
      orderCount: orderIds.size,
    }));
  },

  async getInventorySummary(lowStockThreshold = LOW_STOCK_THRESHOLD) {
    const [totals, lowStock] = await Promise.all([
      prisma.variant.aggregate({
        _sum: { stockOnHand: true, stockReserved: true },
      }),
      prisma.variant.findMany({
        where: {
          status: "active",
          stockOnHand: { lte: lowStockThreshold, gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockOnHand: true,
          stockReserved: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { stockOnHand: "asc" },
        take: 50,
      }),
    ]);

    return {
      totalStockOnHand: totals._sum.stockOnHand ?? 0,
      totalStockReserved: totals._sum.stockReserved ?? 0,
      lowStockThreshold,
      lowStockVariants: lowStock.map((v) => ({
        variantId: v.id,
        variantName: v.name,
        sku: v.sku,
        stockOnHand: v.stockOnHand,
        stockReserved: v.stockReserved,
        productId: v.product.id,
        productName: v.product.name,
      })),
    };
  },

  /** Campaign sell-through from `campaign_items` (no order linkage in schema). */
  async getCampaignSummaries(campaignId?: string | null) {
    const campaigns = await prisma.campaign.findMany({
      where: campaignId ? { id: campaignId } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        startDate: true,
        endDate: true,
        items: {
          select: {
            campaignStock: true,
            stockOnHand: true,
            stockReserved: true,
            productId: true,
            variantId: true,
          },
        },
      },
      orderBy: { endDate: "desc" },
      take: campaignId ? 1 : 20,
    });

    return campaigns.map((c) => {
      let totalCampaignStock = 0;
      let totalOnHand = 0;
      for (const it of c.items) {
        totalCampaignStock += it.campaignStock;
        totalOnHand += it.stockOnHand;
      }
      const soldEstimate = Math.max(0, totalCampaignStock - totalOnHand);
      const sellThroughPct =
        totalCampaignStock > 0 ? Math.round((soldEstimate / totalCampaignStock) * 10000) / 100 : null;

      return {
        campaignId: c.id,
        name: c.name,
        slug: c.slug,
        status: c.status,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        skuCount: c.items.length,
        totalCampaignStock,
        stockOnHand: totalOnHand,
        soldEstimate,
        sellThroughPct,
        note: "Revenue by campaign requires order_items.campaign_item_id (or similar); sell-through is estimated from campaign stock vs on-hand.",
      };
    });
  },
};
