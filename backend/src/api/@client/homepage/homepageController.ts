// src/api/homepage/homepageController.ts
import { Request, Response } from "express";
import { homepageService } from "./homepageService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const homepageController = {
  getCategoriesWithProducts: async (_req: Request, res: Response) => {
    const response = await homepageService.getCategoriesWithProducts();
    handleServiceResponse(response, res);
  },
};
