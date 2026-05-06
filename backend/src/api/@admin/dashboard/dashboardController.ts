import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import type { Request, Response } from "express";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

import { ListDashboardSummarySchema } from "./dashboardModel";
import { dashboardService } from "./dashboardService";

export const dashboardController = {
  getDashboardSummary: async (req: Request, res: Response) => {
    try {
      const q = ListDashboardSummarySchema.shape.query.parse(req.query);
      const response = await dashboardService.getDashboardSummary({
        from: q.from,
        to: q.to,
        grain: q.grain ?? "day",
        statuses: q.statuses,
        categoryId: q.categoryId,
        productId: q.productId,
        campaignId: q.campaignId,
      });
      handleServiceResponse(response, res);
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join(", ");
        return handleServiceResponse(
          ServiceResponse.failure(`Invalid query: ${message}`, null, StatusCodes.BAD_REQUEST),
          res,
        );
      }
      throw err;
    }
  },
};
