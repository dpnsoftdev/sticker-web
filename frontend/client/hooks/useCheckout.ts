import { useCheckoutStore } from "@/stores/checkout.store";

export function useCheckout() {
  return useCheckoutStore();
}
