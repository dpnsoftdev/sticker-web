import { axiosPrivate } from "@apis/clientAxios";
import { API_ENDPOINTS } from "@constants/index";
import type { Variant } from "@types";

export type CreateVariantBody = {
  productId: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  images?: string[];
  isDefault?: boolean;
};

export type UpdateVariantBody = Partial<{
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  isDefault: boolean;
}>;

export async function createVariant(body: CreateVariantBody): Promise<Variant> {
  const res = await axiosPrivate.post<{ data?: Variant }>(
    API_ENDPOINTS.VARIANTS,
    body
  );
  return (res.data?.data ?? res.data) as Variant;
}

export async function updateVariant(
  id: string,
  body: UpdateVariantBody
): Promise<Variant> {
  const res = await axiosPrivate.put<{ data?: Variant }>(
    `${API_ENDPOINTS.VARIANTS}/${id}`,
    body
  );
  return (res.data?.data ?? res.data) as Variant;
}

export async function deleteVariant(id: string): Promise<void> {
  await axiosPrivate.delete(`${API_ENDPOINTS.VARIANTS}/${id}`);
}

/** Deletes the object in S3, then removes the key from the variant's images in the DB. */
export async function removeVariantImage(
  variantId: string,
  key: string
): Promise<Variant> {
  const res = await axiosPrivate.post<{ data?: Variant }>(
    `${API_ENDPOINTS.VARIANTS}/${variantId}/delete-asset`,
    { key }
  );
  return (res.data?.data ?? res.data) as Variant;
}
