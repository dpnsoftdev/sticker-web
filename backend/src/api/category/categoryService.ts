// src/api/category/categoryService.ts
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { assetService } from "@/api/assets/assetService";
import { categoryRepository } from "./categoryRepository";
import { S3_PREFIX_FOLDERS } from "@/common/constants";
import type { CreateCategoryBody, UpdateCategoryBody } from "./categoryModel";

export const categoryService = {
  list: async () => {
    const categories = await categoryRepository.findMany();
    const list = categories.map(({ _count, ...c }) => ({
      ...c,
      productCount: _count.products,
    }));
    return ServiceResponse.success("Categories retrieved", list, StatusCodes.OK);
  },

  getById: async (id: string) => {
    const category = await categoryRepository.findById(id);
    if (!category) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }
    return ServiceResponse.success("Category retrieved", category, StatusCodes.OK);
  },

  getBySlug: async (slug: string) => {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }
    return ServiceResponse.success("Category retrieved", category, StatusCodes.OK);
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

  update: async (id: string, data: UpdateCategoryBody) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }
    if (data.slug != null && data.slug !== existing.slug) {
      const slugTaken = await categoryRepository.findBySlug(data.slug);
      if (slugTaken) {
        return ServiceResponse.failure("Category with this slug already exists", null, StatusCodes.CONFLICT);
      }
    }
    const category = await categoryRepository.update(id, {
      ...(data.name != null && { name: data.name }),
      ...(data.slug != null && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.images !== undefined && { images: data.images }),
    });
    return ServiceResponse.success("Category updated", category, StatusCodes.OK);
  },

  delete: async (id: string) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }

    const imageKeys = existing.images ?? [];
    if (imageKeys.length > 0) {
      try {
        for (const key of imageKeys) {
          const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
          await assetService.deleteObject(normalizedKey);
        }
      } catch (err) {
        console.error("Failed to delete category images from S3:", err);
        return ServiceResponse.failure(
          "Failed to delete category images from storage",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    }

    await categoryRepository.delete(id);
    return ServiceResponse.success("Category deleted", null, StatusCodes.OK);
  },

  deleteAsset: async (categoryId: string, assetPath: string) => {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }

    const normalizedPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
    const expectedPrefix = `${S3_PREFIX_FOLDERS.CATEGORIES}/`;
    if (!normalizedPath.startsWith(expectedPrefix)) {
      return ServiceResponse.failure("Asset does not belong to categories", null, StatusCodes.BAD_REQUEST);
    }

    const imageIndex = category.images.indexOf(normalizedPath);
    if (imageIndex === -1) {
      return ServiceResponse.failure("Asset not found on category", null, StatusCodes.NOT_FOUND);
    }

    try {
      await assetService.deleteObject(normalizedPath);
    } catch (err) {
      console.error("Failed to delete category asset from S3:", err);
      return ServiceResponse.failure("Failed to delete asset from storage", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const updatedImages = category.images.filter((_, i) => i !== imageIndex);
    await categoryRepository.update(categoryId, { images: updatedImages });

    return ServiceResponse.success("Category asset deleted", { images: updatedImages }, StatusCodes.OK);
  },
};
