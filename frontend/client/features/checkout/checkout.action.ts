"use server";

import { orderApi } from "@/features/order/order.api";
import { CreateOrderData } from "@/features/order/order.types";
import { checkoutSchema } from "./checkout.validator";

export async function createOrderAction(formData: CreateOrderData) {
  // Validate with zod
  const validated = checkoutSchema.parse({
    contact_info: formData.contact_info,
    shipping_info: formData.shipping_info,
    payment: formData.payment,
    promotion_code: formData.promotion_code,
  });

  // Create order
  const result = await orderApi.createOrder({
    ...formData,
    promotion_code: validated.promotion_code,
  });

  return result;
}
