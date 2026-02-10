// src/api/variant/variantService.ts
import type { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { variantRepository } from "./variantRepository";
import { CreateVariantBody, VariantListQuery } from "./variantModel";

export const variantService = {
  list: async (query: VariantListQuery) => {
    const variants = await variantRepository.findMany(query);
    return ServiceResponse.success("Variants retrieved", variants, StatusCodes.OK);
  },

  getById: async (id: string) => {
    const variant = await variantRepository.findById(id);
    if (!variant) {
      return ServiceResponse.failure("Variant not found", null, StatusCodes.NOT_FOUND);
    }

    return ServiceResponse.success("Variant retrieved", variant, StatusCodes.OK);
  },

  create: async (data: CreateVariantBody) => {
    const payload: Prisma.VariantCreateInput = {
      product: { connect: { id: data.productId } },
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? null,
      stock: data.stock ?? null,
      images: data.images ?? [],
    };
    const variant = await variantRepository.create(payload);
    return ServiceResponse.success("Variant created", variant, StatusCodes.CREATED);
  },

  update: async (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      price: number | null;
      stock: number | null;
      images: string[];
    }>,
  ) => {
    const variant = await variantRepository.update(id, data);
    return ServiceResponse.success("Variant updated", variant, StatusCodes.OK);
  },

  delete: async (id: string) => {
    await variantRepository.delete(id);
    return ServiceResponse.success("Variant deleted", null, StatusCodes.OK);
  },
};
