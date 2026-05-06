import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { adminOnly, authMiddleware, optionalAuthMiddleware } from "@/common/middleware/authMiddleware";
import {
  OrderSchema,
  CreateOrderSchema,
  GetOrderSchema,
  ListOrdersSchema,
  ListProductVariantAggregatesSchema,
  ProductVariantAggregatesListResponseSchema,
  UpdateOrderStatusSchema,
  UpdateOrderAdminNoteSchema,
  VerifyPhoneAuthSchema,
  VerifyPhoneAuthSuccessDataSchema,
  OrderTrackPublicLineItemSchema,
  CheckPhoneForTrackSchema,
  CheckPhoneForTrackSuccessDataSchema,
  RequestOrderTrackEmailOtpSchema,
  RequestOrderTrackEmailOtpSuccessDataSchema,
  VerifyOrderTrackEmailOtpSchema,
  ListMyOrdersSchema,
  GetMyOrderSchema,
  ClaimGuestOrdersSchema,
  ClaimGuestOrdersSuccessDataSchema,
} from "./orderModel";
import { orderController } from "./orderController";
import { validateRequest } from "@/common/utils/httpHandlers";
import { StatusCodes } from "http-status-codes";

export const orderRegistry = new OpenAPIRegistry();
export const orderRouter = Router();

orderRegistry.register("Order", OrderSchema);

orderRegistry.registerPath({
  method: "post",
  path: "/orders",
  tags: ["Order"],
  description: "Create a new order",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrderSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(OrderSchema, "Order created", StatusCodes.CREATED),
});

orderRouter.post("/", optionalAuthMiddleware, validateRequest(CreateOrderSchema), orderController.createOrder);

orderRegistry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["Order"],
  description: "List orders (admin)",
  security: [{ bearerAuth: [] }],
  request: { query: ListOrdersSchema.shape.query },
  responses: createApiResponse(OrderSchema, "Orders retrieved"),
});

orderRouter.get("/", ...adminOnly, validateRequest(ListOrdersSchema), orderController.listOrders);

orderRegistry.registerPath({
  method: "get",
  path: "/orders/product-variant-aggregates",
  tags: ["Order"],
  description: "List order demand grouped by product + variant (admin)",
  security: [{ bearerAuth: [] }],
  request: { query: ListProductVariantAggregatesSchema.shape.query },
  responses: createApiResponse(ProductVariantAggregatesListResponseSchema, "Aggregates retrieved", StatusCodes.OK),
});

orderRouter.get("/product-variant-aggregates", ...adminOnly, orderController.listProductVariantAggregates);

orderRegistry.registerPath({
  method: "get",
  path: "/orders/me",
  tags: ["Order"],
  description: "List orders for the authenticated user (linked by userId)",
  security: [{ bearerAuth: [] }],
  request: { query: ListMyOrdersSchema.shape.query },
  responses: createApiResponse(OrderSchema, "Orders retrieved"),
});

orderRouter.get("/me", authMiddleware, validateRequest(ListMyOrdersSchema), orderController.listMyOrders);

orderRegistry.register("ClaimGuestOrdersSuccess", ClaimGuestOrdersSuccessDataSchema);

orderRegistry.registerPath({
  method: "post",
  path: "/orders/me/claim-guest",
  tags: ["Order"],
  description:
    "Link guest orders (user_id null) whose contact.email matches the authenticated user's email (case-insensitive). Does not modify contact/shipping/payment JSON.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ClaimGuestOrdersSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ClaimGuestOrdersSuccessDataSchema, "Guest orders linked", StatusCodes.OK),
});

orderRouter.post(
  "/me/claim-guest",
  authMiddleware,
  validateRequest(ClaimGuestOrdersSchema),
  orderController.claimGuestOrders,
);

orderRegistry.registerPath({
  method: "get",
  path: "/orders/me/{orderId}",
  tags: ["Order"],
  description: "Get one order if it belongs to the authenticated user",
  security: [{ bearerAuth: [] }],
  request: {
    params: GetMyOrderSchema.shape.params,
  },
  responses: createApiResponse(OrderSchema, "Order retrieved"),
});

orderRouter.get("/me/:orderId", authMiddleware, validateRequest(GetMyOrderSchema), orderController.getMyOrder);

orderRegistry.register("OrderTrackPublicLineItem", OrderTrackPublicLineItemSchema);
orderRegistry.register("OrderTrackPhoneAuthSuccess", VerifyPhoneAuthSuccessDataSchema);
orderRegistry.register("OrderTrackCheckPhoneSuccess", CheckPhoneForTrackSuccessDataSchema);

orderRegistry.registerPath({
  method: "post",
  path: "/orders/track/check-phone",
  tags: ["Order"],
  description:
    "Check that a phone number has at least one order before starting Firebase Phone Auth (SMS). Does not send SMS.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CheckPhoneForTrackSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(CheckPhoneForTrackSuccessDataSchema, "Phone may proceed to OTP", StatusCodes.OK),
});

orderRouter.post(
  "/track/check-phone",
  validateRequest(CheckPhoneForTrackSchema),
  orderController.checkPhoneForTrackOrder,
);

orderRegistry.register("OrderTrackRequestEmailOtpSuccess", RequestOrderTrackEmailOtpSuccessDataSchema);

orderRegistry.registerPath({
  method: "post",
  path: "/orders/track/request-email-otp",
  tags: ["Order"],
  description:
    "If the email has at least one order, send a 6-digit OTP to that address and return a short-lived session id for verify.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestOrderTrackEmailOtpSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RequestOrderTrackEmailOtpSuccessDataSchema, "OTP sent", StatusCodes.OK),
});

orderRouter.post(
  "/track/request-email-otp",
  validateRequest(RequestOrderTrackEmailOtpSchema),
  orderController.requestOrderTrackEmailOtp,
);

orderRegistry.registerPath({
  method: "post",
  path: "/orders/track/verify-email-otp",
  tags: ["Order"],
  description: "Verify email OTP session from request-email-otp and return public order summaries for that email.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyOrderTrackEmailOtpSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(VerifyPhoneAuthSuccessDataSchema, "Orders for verified email", StatusCodes.OK),
});

orderRouter.post(
  "/track/verify-email-otp",
  validateRequest(VerifyOrderTrackEmailOtpSchema),
  orderController.verifyOrderTrackEmailOtp,
);

orderRegistry.registerPath({
  method: "post",
  path: "/orders/track/verify-phone-auth",
  tags: ["Order"],
  description:
    "Verify Firebase Phone Auth ID token and return orders for that phone (SMS via client SDK), or with bypassAuth+phone when server allows dev bypass.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyPhoneAuthSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(VerifyPhoneAuthSuccessDataSchema, "Orders for verified phone", StatusCodes.OK),
});

orderRouter.post("/track/verify-phone-auth", validateRequest(VerifyPhoneAuthSchema), orderController.verifyPhoneAuth);

orderRegistry.registerPath({
  method: "get",
  path: "/orders/{id}",
  tags: ["Order"],
  description: "Get an order by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: GetOrderSchema.shape.params,
  },
  responses: createApiResponse(OrderSchema, "Order retrieved"),
});

orderRouter.get("/:id", ...adminOnly, validateRequest(GetOrderSchema), orderController.getOrder);

orderRegistry.registerPath({
  method: "patch",
  path: "/orders/{id}/status",
  tags: ["Order"],
  description: "Update order status (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: UpdateOrderStatusSchema.shape.params,
    body: { content: { "application/json": { schema: UpdateOrderStatusSchema.shape.body } } },
  },
  responses: createApiResponse(OrderSchema, "Order status updated"),
});

orderRouter.patch(
  "/:id/status",
  ...adminOnly,
  validateRequest(UpdateOrderStatusSchema),
  orderController.updateOrderStatus,
);

orderRegistry.registerPath({
  method: "patch",
  path: "/orders/{id}/admin-note",
  tags: ["Order"],
  description: "Update internal admin note for an order",
  security: [{ bearerAuth: [] }],
  request: {
    params: UpdateOrderAdminNoteSchema.shape.params,
    body: { content: { "application/json": { schema: UpdateOrderAdminNoteSchema.shape.body } } },
  },
  responses: createApiResponse(OrderSchema, "Admin note updated"),
});

orderRouter.patch(
  "/:id/admin-note",
  ...adminOnly,
  validateRequest(UpdateOrderAdminNoteSchema),
  orderController.updateOrderAdminNote,
);
