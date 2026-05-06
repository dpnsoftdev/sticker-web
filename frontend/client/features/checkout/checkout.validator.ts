import { z } from "zod";

import {
  DISPLAY_NAME_MAX_LENGTH,
  isValidVietnamMobilePhone,
  VALIDATION_MESSAGES_VI,
} from "@/lib/validation";

export const contactInfoSchema = z.object({
  social_link: z.string().url("Invalid social media link"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(s => isValidVietnamMobilePhone(s), {
    message: VALIDATION_MESSAGES_VI.phoneInvalid,
  }),
});

export const shippingInfoSchema = z.object({
  receiver_name: z
    .string()
    .min(1, "Receiver name is required")
    .max(DISPLAY_NAME_MAX_LENGTH, "Receiver name is too long"),
  receiver_phone: z.string().refine(s => isValidVietnamMobilePhone(s), {
    message: VALIDATION_MESSAGES_VI.phoneInvalid,
  }),
  address: z.string().min(1, "Shipping address is required"),
  notes: z.string().optional(),
});

export const paymentInfoSchema = z.object({
  plan_type: z.enum(["full", "deposit"]),
  method: z.string().min(1, "Payment method is required"),
  bill_image: z.string().min(1, "Payment receipt is required"),
});

export const checkoutSchema = z.object({
  contact_info: contactInfoSchema,
  shipping_info: shippingInfoSchema,
  payment: paymentInfoSchema,
  promotion_code: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
