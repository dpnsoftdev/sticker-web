import { z } from "zod";

/** Admin dashboard: revenue & inventory summary */
export const DashboardSummaryQuerySchema = z.object({
  /** ISO date/datetime — start of range (inclusive) */
  from: z.string().min(1),
  /** ISO date/datetime — end of range (inclusive) */
  to: z.string().min(1),
  grain: z.enum(["day", "week", "month"]).optional().default("day"),
  /** Comma-separated OrderStatus values */
  statuses: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});

export const ListDashboardSummarySchema = z.object({
  query: DashboardSummaryQuerySchema,
});
