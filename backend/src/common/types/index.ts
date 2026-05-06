import { Product, Variant } from "../lib/prisma-client";

export type PreorderJson = { start_date?: string; end_date?: string } | null;

export type UserRole = "owner" | "admin" | "customer";

export type ProductWithVariants = Product & { variants: Variant[] };

export type ReservationStatus = "active" | "confirmed" | "released" | "expired";

export type OrderStatus = "pending_confirmation" | "payment_confirmed" | "shipping" | "delivered" | "cancelled";
