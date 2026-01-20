import { Order, OrderItem } from "@/types/order";

export interface CreateOrderData {
  items: OrderItem[];
  contact_info: {
    social_link: string;
    email: string;
    phone: string;
  };
  shipping_info: {
    receiver_name: string;
    receiver_phone?: string;
    address: string;
    notes?: string;
  };
  promotion_code?: string;
  payment: {
    plan_type: "full" | "deposit";
    method: string;
    bill_image: string;
  };
}

export interface CreateOrderResponse {
  order: Order;
  order_code: string;
}

export type { Order, OrderItem };
