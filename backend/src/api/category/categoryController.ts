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

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await categoryService.getById(id as string);
    handleServiceResponse(response, res);
  },

  getBySlug: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const response = await categoryService.getBySlug(slug as string);
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

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const newImageKeys: string[] = [];
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length) {
      for (const file of files) {
        const result = await assetService.uploadFile(file.buffer, file.mimetype, "categories");
        if (result.data?.key) newImageKeys.push(result.data.key);
      }
    }
    const rawExisting = req.body.existingImages;
    const existingImages: string[] = Array.isArray(rawExisting)
      ? rawExisting
      : typeof rawExisting === "string" && rawExisting.trim()
        ? (() => {
            try {
              const parsed = JSON.parse(rawExisting) as unknown;
              return Array.isArray(parsed) ? (parsed as string[]) : [];
            } catch {
              return [];
            }
          })()
        : [];
    const images = [...existingImages, ...newImageKeys];
    const body = { ...req.body, images };
    const response = await categoryService.update(id as string, body);
    handleServiceResponse(response, res);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await categoryService.delete(id as string);
    handleServiceResponse(response, res);
  },

  deleteCategoryAsset: async (req: Request, res: Response) => {
    const categoryId = req.params.id as string;
    const { path: assetPath } = req.body as { path: string };
    const response = await categoryService.deleteAsset(categoryId, assetPath);
    handleServiceResponse(response, res);
  },
};
