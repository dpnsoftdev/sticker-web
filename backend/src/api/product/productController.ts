// src/api/product/productController.ts
import { Request, Response } from "express";
import { productService } from "./productService";
import { productViewService } from "./productViewService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const productController = {
  getListProducts: async (req: Request, res: Response) => {
    const response = await productService.list(req.query as any);
    handleServiceResponse(response, res);
  },

  getProductDetails: async (req: Request, res: Response) => {
    const response = await productService.getById(req.params.id as string);
    handleServiceResponse(response, res);
  },

  recordView: async (req: Request, res: Response) => {
    const body = req.body as { viewerId?: string };

    const response = await productViewService.recordView({
      productId: req.params.id as string,
      viewerId: body?.viewerId,
      authUserId: req.user?.sub,
    });
    handleServiceResponse(response, res);
  },

  getProductBySlug: async (req: Request, res: Response) => {
    const response = await productService.getBySlug(req.params.slug as string);
    handleServiceResponse(response, res);
  },

  createProduct: async (req: Request, res: Response) => {
    const response = await productService.create(req.body);
    handleServiceResponse(response, res);
  },

  updateProduct: async (req: Request, res: Response) => {
    const response = await productService.update(req.params.id as string, req.body);
    handleServiceResponse(response, res);
  },

  deleteProduct: async (req: Request, res: Response) => {
    const response = await productService.delete(req.params.id as string);
    handleServiceResponse(response, res);
  },

  deleteProductAsset: async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const { path: assetPath } = req.body as { path: string };
    const response = await productService.deleteAsset(productId, assetPath);
    handleServiceResponse(response, res);
  },
};
