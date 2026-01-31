// src/api/category/categoryController.ts
import { Request, Response } from "express";
import { categoryService } from "./categoryService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const categoryController = {
  getList: async (_req: Request, res: Response) => {
    const response = await categoryService.list();
    handleServiceResponse(response, res);
  },

  create: async (req: Request, res: Response) => {
    const response = await categoryService.create(req.body);
    handleServiceResponse(response, res);
  },
};
