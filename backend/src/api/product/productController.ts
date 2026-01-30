// src/api/product/productController.ts
import { Request, Response } from "express";
import { productService } from "./productService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const productController = {
  getListProducts: async (req: Request, res: Response) => {
    const response = await productService.list(req.query);
    handleServiceResponse(response, res);
  },

  getProductDetails: async (req: Request, res: Response) => {
    const response = await productService.getById(req.params.id as string);
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
};
