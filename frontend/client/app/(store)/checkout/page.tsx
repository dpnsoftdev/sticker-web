"use client";

import { useCheckout } from "@/hooks/useCheckout";

export default function CheckoutPage() {
  const checkout = useCheckout();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <p>Checkout flow - Step {checkout.step}</p>
    </div>
  );
}
