import type { Category } from "@types";

import { axiosPrivate } from "@apis/clientAxios";

export type CreateCategoryInput = Pick<Category, "name" | "slug" | "description" | "image">;

export async function fetchCategories(): Promise<Category[]> {
  const res = await axiosPrivate.get("/categories");
  return res.data?.data ?? res.data;
}

export async function createCategory(payload: CreateCategoryInput): Promise<Category> {
  const res = await axiosPrivate.post("/categories/create", payload);
  return res.data?.data ?? res.data;
}
