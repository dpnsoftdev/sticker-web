// src/api/category/categoryController.ts
import { Request, Response } from "express";
import { assetService } from "@/api/assets/assetService";
import { categoryService } from "./categoryService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export const categoryController = {
  getList: async (_req: Request, res: Response) => {
    const response = await categoryService.list();
    handleServiceResponse(response, res);
  },

  create: async (req: Request, res: Response) => {
    const imageKeys: string[] = [];
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length) {
      for (const file of files) {
        const result = await assetService.uploadFile(file.buffer, file.mimetype, "categories");
        if (result.data?.key) imageKeys.push(result.data.key);
      }
    }
    const body = { ...req.body, images: imageKeys };
    const response = await categoryService.create(body);
    handleServiceResponse(response, res);
  },
};
