import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { StatusCodes } from "http-status-codes";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly } from "@/common/middleware/authMiddleware";
import { validateRequest } from "@/common/utils/httpHandlers";

import { ListDashboardSummarySchema } from "./dashboardModel";
import { dashboardController } from "./dashboardController";

export const dashboardRegistry = new OpenAPIRegistry();
export const dashboardRouter = Router();

dashboardRegistry.registerPath({
  method: "get",
  path: "/admin/dashboard/summary",
  tags: ["Admin Dashboard"],
  description: "Revenue, orders, inventory summary (admin)",
  security: [{ bearerAuth: [] }],
  request: { query: ListDashboardSummarySchema.shape.query },
  responses: createApiResponse(null, "Dashboard summary", StatusCodes.OK),
});

dashboardRouter.get(
  "/summary",
  ...adminOnly,
  validateRequest(ListDashboardSummarySchema),
  dashboardController.getDashboardSummary,
);
