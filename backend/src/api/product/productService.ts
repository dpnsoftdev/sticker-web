// src/api/product/productService.ts
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { productRepository } from "./productRepository";
import { ProductListQuery } from "./productModel";

export const productService = {
  list: async (query: ProductListQuery) => {
    const products = await productRepository.findMany(query);
    console.log("products =>", products);
    return ServiceResponse.success("Products retrieved", products, StatusCodes.OK);
  },

  getById: async (id: string) => {
    const product = await productRepository.findById(id);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }

    return ServiceResponse.success("Product retrieved", product, StatusCodes.OK);
  },

  create: async (data: any) => {
    const product = await productRepository.create(data);
    return ServiceResponse.success("Product created", product, StatusCodes.CREATED);
  },

  update: async (id: string, data: any) => {
    const product = await productRepository.update(id, data);
    return ServiceResponse.success("Product updated", product, StatusCodes.OK);
  },

  delete: async (id: string) => {
    await productRepository.delete(id);
    return ServiceResponse.success("Product deleted", null, StatusCodes.OK);
  },
};
