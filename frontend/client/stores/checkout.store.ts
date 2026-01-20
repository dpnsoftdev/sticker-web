import { create } from "zustand";
import { PAYMENT_PLAN, PAYMENT_METHOD } from "@/lib/constants";

export type PaymentPlan = (typeof PAYMENT_PLAN)[keyof typeof PAYMENT_PLAN];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export interface ContactInfo {
  social_link: string;
  email: string;
  phone: string;
}

export interface ShippingInfo {
  receiver_name: string;
  receiver_phone: string;
  address: string;
  notes?: string;
}

export interface PaymentInfo {
  plan_type: PaymentPlan;
  method: PaymentMethod;
  bill_image: string | null;
}

export interface CheckoutState {
  step: number;
  contact_info: ContactInfo | null;
  shipping_info: ShippingInfo | null;
  promotion_code: string | null;
  promotion_discount: number;
  payment_info: PaymentInfo | null;
  setStep: (step: number) => void;
  setContactInfo: (info: ContactInfo) => void;
  setShippingInfo: (info: ShippingInfo) => void;
  setPromotionCode: (code: string | null) => void;
  setPromotionDiscount: (discount: number) => void;
  setPaymentInfo: (info: PaymentInfo) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  contact_info: null,
  shipping_info: null,
  promotion_code: null,
  promotion_discount: 0,
  payment_info: null,
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setContactInfo: (info) => set({ contact_info: info }),
  setShippingInfo: (info) => set({ shipping_info: info }),
  setPromotionCode: (code) => set({ promotion_code: code }),
  setPromotionDiscount: (discount) => set({ promotion_discount: discount }),
  setPaymentInfo: (info) => set({ payment_info: info }),
  reset: () => set(initialState),
}));
