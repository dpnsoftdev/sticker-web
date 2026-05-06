import { z } from "zod";

const orderStatusEnum = z.enum(["pending_confirmation", "payment_confirmed", "shipping", "delivered", "cancelled"]);
const promotionTypeEnum = z.enum(["percentage", "fixed_amount"]);

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

/** OrderItem as returned from API (snapshot fields) */
export const OrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int(),
  productName: z.string(),
  variantName: z.string().nullable(),
  unitPrice: z.number().int(),
  currency: z.string(),
  image: z.string().nullable(),
  createdAt: z.string().datetime(),
});

/** OrderPromotion as returned from API */
export const OrderPromotionResponseSchema = z.object({
  id: z.string(),
  promotionId: z.string().nullable(),
  promotionCode: z.string().nullable(),
  discountType: promotionTypeEnum,
  discountValue: z.number().int(),
  appliedAmount: z.number().int(),
});

export const ContactSchema = z.object({
  social_link: z.string().min(1, "Social link is required"),
  email: z.string().email(),
  phone: z.string().min(1, "Phone is required"),
});

export const ShippingInfoSchema = z.object({
  receiver_name: z.string().min(1, "Receiver name is required"),
  receiver_phone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional().nullable(),
});

export const PaymentSchema = z.object({
  plan_type: z.enum(["full", "deposit"]),
  method: z.string().min(1, "Payment method is required"),
  bill_image: z.string().nullable().optional(),
});

export const CreateOrderBodySchema = z.object({
  contact: ContactSchema,
  shippingInfo: ShippingInfoSchema,
  payment: PaymentSchema,
  promotionCode: z.string().max(100).optional().nullable(),
  subtotalAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  finalAmount: z.number().min(0),
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
});

export const CreateOrderSchema = z.object({
  body: CreateOrderBodySchema,
});

export const GetOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const ListOrdersQuerySchema = z.object({
  status: orderStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().max(200).optional(),
});

export const ListOrdersSchema = z.object({
  query: ListOrdersQuerySchema,
});

/** Authenticated customer: list own orders (same query shape as admin list, scoped by JWT). */
export const ListMyOrdersSchema = z.object({
  query: ListOrdersQuerySchema,
});

export const GetMyOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

/** POST /orders/me/claim-guest — no fields; links guest orders by email match only. */
export const ClaimGuestOrdersSchema = z.object({
  body: z.object({}).strict().default({}),
});

export const ClaimGuestOrdersSuccessDataSchema = z.object({
  linkedCount: z.number().int().min(0),
});

/** Query for aggregated demand per product+variant (admin). */
export const ListProductVariantAggregatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  /** When true (default), omit line items from cancelled orders. */
  excludeCancelled: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
  keyword: z.string().max(200).optional(),
  orderStatus: orderStatusEnum.optional(),
});

export const ListProductVariantAggregatesSchema = z.object({
  query: ListProductVariantAggregatesQuerySchema,
});

export const OrderRefInVariantAggregateSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusEnum,
  createdAt: z.string().datetime(),
  quantity: z.number().int(),
  orderItemId: z.string().uuid(),
});

export const ProductVariantOrderAggregateSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  productSlug: z.string().nullable(),
  productName: z.string(),
  variantName: z.string().nullable(),
  unitPrice: z.number().int(),
  currency: z.string(),
  image: z.string().nullable(),
  orderCount: z.number().int(),
  totalQuantity: z.number().int(),
  orders: z.array(OrderRefInVariantAggregateSchema),
});

export const ProductVariantAggregatesListResponseSchema = z.object({
  data: z.array(ProductVariantOrderAggregateSchema),
  total: z.number().int(),
});

export const UpdateOrderStatusBodySchema = z.object({
  status: orderStatusEnum,
});

export const UpdateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: UpdateOrderStatusBodySchema,
});

export const UpdateOrderAdminNoteBodySchema = z.object({
  adminNote: z.union([z.string().max(10000), z.null()]),
});

export const UpdateOrderAdminNoteSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: UpdateOrderAdminNoteBodySchema,
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  currency: z.string().default("VND"),
  status: orderStatusEnum,
  createdAt: z.string().datetime(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  finalAmount: z.number().int(),
  adminNote: z.string().nullable(),
  contact: ContactSchema,
  shippingInfo: ShippingInfoSchema,
  payment: PaymentSchema,
  promotions: z.array(OrderPromotionResponseSchema),
  items: z.array(OrderItemResponseSchema),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;
export type Order = z.infer<typeof OrderSchema>;

/** Line item snapshot for public order-track response. */
export const OrderTrackPublicLineItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int(),
  productName: z.string(),
  variantName: z.string().nullable(),
  unitPrice: z.number().int(),
  currency: z.string(),
  image: z.string().nullable(),
});

/** Public order summary for phone-auth track flow (Firebase ID token verified server-side). */
export const OrderTrackPublicOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  createdAt: z.string().datetime(),
  finalAmount: z.number().int(),
  currency: z.string(),
  items: z.array(OrderTrackPublicLineItemSchema),
});

export const VerifyPhoneAuthBodySchema = z
  .object({
    idToken: z.string().min(10).optional(),
    phone: z.string().min(8).optional(),
    bypassAuth: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.bypassAuth === true) {
      const p = data.phone?.trim();
      if (!p || p.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "phone is required when bypassAuth is true",
          path: ["phone"],
        });
      }
    } else if (!data.idToken || data.idToken.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "idToken is required",
        path: ["idToken"],
      });
    }
  });

export const VerifyPhoneAuthSchema = z.object({
  body: VerifyPhoneAuthBodySchema,
});

export const VerifyPhoneAuthSuccessDataSchema = z.object({
  orders: z.array(OrderTrackPublicOrderSchema),
});

export const CheckPhoneForTrackBodySchema = z.object({
  phone: z.string().min(8, "Phone number is required."),
});

export const CheckPhoneForTrackSchema = z.object({
  body: CheckPhoneForTrackBodySchema,
});

export const CheckPhoneForTrackSuccessDataSchema = z.object({
  eligible: z.literal(true),
});

export const RequestOrderTrackEmailOtpBodySchema = z.object({
  email: z.string().email("Invalid email address."),
});

export const RequestOrderTrackEmailOtpSchema = z.object({
  body: RequestOrderTrackEmailOtpBodySchema,
});

export const RequestOrderTrackEmailOtpSuccessDataSchema = z.object({
  orderTrackEmailSessionId: z.string().uuid(),
});

export const VerifyOrderTrackEmailOtpBodySchema = z.object({
  orderTrackEmailSessionId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits."),
});

export const VerifyOrderTrackEmailOtpSchema = z.object({
  body: VerifyOrderTrackEmailOtpBodySchema,
});
