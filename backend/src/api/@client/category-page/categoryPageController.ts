// src/api/@client/category-page/categoryPageController.ts
import { Request, Response } from "express";
import { categoryPageService } from "./categoryPageService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { CategoryPageProductsQuerySchema } from "./categoryPageModel";

export const categoryPageController = {
  getProductsByCategorySlug: async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const parsed = CategoryPageProductsQuerySchema.safeParse(req.query);
    const query = parsed.success ? parsed.data : undefined;
    const response = await categoryPageService.getProductsByCategorySlug(slug, {
      page: query?.page ?? 1,
      limit: query?.limit ?? 12,
      sort: query?.sort ?? "newest",
      keyword: query?.keyword,
    });
    handleServiceResponse(response, res);
  },
};
