"use client";

import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { items, subtotal, itemCount } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      {itemCount === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div>
          <p>Items: {itemCount}</p>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
