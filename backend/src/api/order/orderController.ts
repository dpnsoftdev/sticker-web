import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { Request, Response } from "express";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

import { getClientIp } from "@/common/utils";
import { ListProductVariantAggregatesSchema } from "./orderModel";
import { orderService } from "./orderService";

export const orderController = {
  createOrder: async (req: Request, res: Response) => {
    const response = await orderService.create(req.body, {
      authenticatedUserId: req.user?.sub,
    });
    handleServiceResponse(response, res);
  },

  listMyOrders: async (req: Request, res: Response) => {
    const userId = req.user?.sub as string;
    const { status, page, limit } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };
    const response = await orderService.listMine(userId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    handleServiceResponse(response, res);
  },

  getMyOrder: async (req: Request, res: Response) => {
    const userId = req.user?.sub as string;
    const response = await orderService.getMineById(userId, req.params.orderId as string);
    handleServiceResponse(response, res);
  },

  claimGuestOrders: async (req: Request, res: Response) => {
    const userId = req.user?.sub as string;
    const response = await orderService.claimGuestOrdersByEmail(userId);
    handleServiceResponse(response, res);
  },

  getOrder: async (req: Request, res: Response) => {
    const response = await orderService.getById(req.params.id as string);
    handleServiceResponse(response, res);
  },

  listOrders: async (req: Request, res: Response) => {
    const { status, page, limit, keyword } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
      keyword?: string;
    };
    const response = await orderService.list({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      keyword,
    });
    handleServiceResponse(response, res);
  },

  listProductVariantAggregates: async (req: Request, res: Response) => {
    try {
      const q = ListProductVariantAggregatesSchema.shape.query.parse(req.query);
      const response = await orderService.listProductVariantAggregates({
        page: q.page,
        limit: q.limit,
        excludeCancelled: q.excludeCancelled,
        keyword: q.keyword,
        orderStatus: q.orderStatus,
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

  updateOrderStatus: async (req: Request, res: Response) => {
    const response = await orderService.updateStatus(req.params.id as string, req.body.status);
    handleServiceResponse(response, res);
  },

  updateOrderAdminNote: async (req: Request, res: Response) => {
    const response = await orderService.updateAdminNote(req.params.id as string, req.body.adminNote);
    handleServiceResponse(response, res);
  },

  verifyPhoneAuth: async (req: Request, res: Response) => {
    const { idToken, phone, bypassAuth } = req.body as {
      idToken?: string;
      phone?: string;
      bypassAuth?: boolean;
    };
    const response = await orderService.verifyPhoneAndGetOrders({ idToken, phone, bypassAuth }, getClientIp(req));
    handleServiceResponse(response, res);
  },

  checkPhoneForTrackOrder: async (req: Request, res: Response) => {
    const response = await orderService.checkPhoneAllowedTrackOrder(req.body.phone as string, getClientIp(req));
    handleServiceResponse(response, res);
  },

  requestOrderTrackEmailOtp: async (req: Request, res: Response) => {
    const response = await orderService.requestOrderTrackEmailOtp(req.body.email as string, getClientIp(req));
    handleServiceResponse(response, res);
  },

  verifyOrderTrackEmailOtp: async (req: Request, res: Response) => {
    const { orderTrackEmailSessionId, otp } = req.body as { orderTrackEmailSessionId: string; otp: string };
    const response = await orderService.verifyOrderTrackEmailOtp({ orderTrackEmailSessionId, otp });
    handleServiceResponse(response, res);
  },
};
