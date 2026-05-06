import type { OrderStatus } from "@types";

export type DashboardGrain = "day" | "week" | "month";

export type DashboardOverview = {
  orderCount: number;
  gmv: number;
  discountTotal: number;
  netRevenue: number;
  aov: number;
  previous: {
    orderCount: number;
    gmv: number;
    discountTotal: number;
    netRevenue: number;
    aov: number;
  };
  changePct: {
    orderCount: number | null;
    gmv: number | null;
    discountTotal: number | null;
    netRevenue: number | null;
    aov: number | null;
  };
};

export type DashboardStatusRow = {
  status: OrderStatus;
  orderCount: number;
  netRevenue: number;
  gmv: number;
};

export type DashboardTimeBucket = {
  bucket: string;
  orderCount: number;
  gmv: number;
  discount: number;
  netRevenue: number;
};

export type DashboardSummaryResponse = {
  overview: DashboardOverview;
  byStatus: DashboardStatusRow[];
  timeSeries: {
    current: DashboardTimeBucket[];
    previous: DashboardTimeBucket[];
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topVariants: Array<{
    variantId: string;
    productId: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    revenue: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    quantity: number;
    revenue: number;
  }>;
  promotions: Array<{
    promotionId: string | null;
    promotionCode: string | null;
    redemptionLines: number;
    totalDiscount: number;
    orderRevenue: number;
    orderCount: number;
  }>;
  inventory: {
    totalStockOnHand: number;
    totalStockReserved: number;
    lowStockThreshold: number;
    lowStockVariants: Array<{
      variantId: string;
      variantName: string;
      sku: string | null;
      stockOnHand: number;
      stockReserved: number;
      productId: string;
      productName: string;
    }>;
  };
  campaigns: Array<{
    campaignId: string;
    name: string;
    slug: string;
    status: string;
    startDate: string;
    endDate: string;
    skuCount: number;
    totalCampaignStock: number;
    stockOnHand: number;
    soldEstimate: number;
    sellThroughPct: number | null;
    note: string;
  }>;
  meta: {
    from: string;
    to: string;
    prevFrom: string;
    prevTo: string;
    grain: DashboardGrain;
    empty: boolean;
  };
};
