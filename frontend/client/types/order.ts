import { ORDER_STATUS, PAYMENT_PLAN, PAYMENT_METHOD } from "@/lib/constants";

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type PaymentPlan = (typeof PAYMENT_PLAN)[keyof typeof PAYMENT_PLAN];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export interface OrderItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product_name: string;
  variant_name: string | null;
  sku: string;
}

export interface Order {
  id: string;
  order_code: string;
  status: OrderStatus;
  items: OrderItem[];
  contact_info: {
    social_link: string;
    email: string;
    phone: string;
  };
  shipping_info: {
    receiver_name: string;
    receiver_phone: string | null;
    address: string;
    notes: string | null;
  };
  payment: {
    plan_type: PaymentPlan;
    method: PaymentMethod;
    bill_image: string | null;
    bank_info?: {
      account_holder: string;
      bank: string;
      account_number: string;
    };
  };
  promotion: {
    promotion_id: string | null;
    code: string | null;
    discount_amount: number;
    discount_type: string | null;
  } | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  payable_amount: number;
  created_at: string;
  updated_at: string;
}
