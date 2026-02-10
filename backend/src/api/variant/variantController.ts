// src/api/variant/variantController.ts
import { Request, Response } from "express";
import { variantService } from "./variantService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const variantController = {
  getListVariants: async (req: Request, res: Response) => {
    const response = await variantService.list(req.query as any);
    handleServiceResponse(response, res);
  },

  getVariantDetails: async (req: Request, res: Response) => {
    const response = await variantService.getById(req.params.id as string);
    handleServiceResponse(response, res);
  },

  createVariant: async (req: Request, res: Response) => {
    const response = await variantService.create(req.body);
    handleServiceResponse(response, res);
  },

  updateVariant: async (req: Request, res: Response) => {
    const response = await variantService.update(req.params.id as string, req.body);
    handleServiceResponse(response, res);
  },

  deleteVariant: async (req: Request, res: Response) => {
    const response = await variantService.delete(req.params.id as string);
    handleServiceResponse(response, res);
  },
};
