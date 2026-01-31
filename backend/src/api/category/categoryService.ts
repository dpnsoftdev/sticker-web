// src/api/category/categoryService.ts
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { categoryRepository } from "./categoryRepository";
import type { CreateCategoryBody } from "./categoryModel";

export const categoryService = {
  list: async () => {
    const categories = await categoryRepository.findMany();
    return ServiceResponse.success("Categories retrieved", categories, StatusCodes.OK);
  },

  create: async (data: CreateCategoryBody) => {
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) {
      return ServiceResponse.failure("Category with this slug already exists", null, StatusCodes.CONFLICT);
    }
    const category = await categoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      images: data.images ?? [],
    });
    return ServiceResponse.success("Category created", category, StatusCodes.CREATED);
  },
};
