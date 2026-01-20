import { z } from "zod";

export const contactInfoSchema = z.object({
  social_link: z.string().url("Invalid social media link"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export const shippingInfoSchema = z.object({
  receiver_name: z.string().min(1, "Receiver name is required"),
  receiver_phone: z.string().optional(),
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
