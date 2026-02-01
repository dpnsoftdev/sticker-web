import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

export type AddToCartInput = Omit<CartItem, "cartItemId"> & {
  cartItemId?: string; // allow passing in, but store can compute
};

interface CartStore {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  // used when you fetch product/variant info and want to fill display fields
  hydrateItem: (cartItemId: string, patch: Partial<CartItem>) => void;
  removeItem: (cartItemId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  incrementQuantity: (cartItemId: string) => void;
  decrementQuantity: (cartItemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const cartItemIdOf = (productId: string, variantId?: string) =>
  `${productId}::${variantId ?? "default"}`;

export const clampQty = (n: number) =>
  Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;

export const getUnitPrice = (item: {
  campaignPrice?: number;
  price?: number;
}) => item.campaignPrice ?? item.price ?? 0;

export const formatVND = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: input => {
        const cartItemId =
          input.cartItemId ?? cartItemIdOf(input.productId, input.variantId);
        const quantity = clampQty(input.quantity);

        set(state => {
          // Check if the item already exists in the cart
          const existingIndex = state.items.findIndex(
            i => i.cartItemId === cartItemId
          );
          if (existingIndex !== -1) {
            // Merge by creating a new array
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: clampQty(
                updatedItems[existingIndex].quantity + quantity
              ), // Ensure clamped result
            };
            return { items: updatedItems };
          } else {
            // Compose the new item safely
            const newItem: CartItem = {
              cartItemId,
              productId: input.productId,
              variantId: input.variantId,
              quantity,
              productName: input.productName ?? "",
              variantName: input.variantName ?? "",
              price: input.price,
              campaignPrice: input.campaignPrice,
              image: input.image,
            };
            return { items: [...state.items, newItem] };
          }
        });
      },

      hydrateItem: (cartItemId, patch) => {
        set(state => ({
          items: state.items.map(i =>
            i.cartItemId === cartItemId ? { ...i, ...patch } : i
          ),
        }));
      },

      removeItem: cartItemId => {
        set(state => ({
          items: state.items.filter(i => i.cartItemId !== cartItemId),
        }));
      },

      setQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        const q = clampQty(quantity);
        set(state => ({
          items: state.items.map(i =>
            i.cartItemId === cartItemId ? { ...i, quantity: q } : i
          ),
        }));
      },

      incrementQuantity: cartItemId => {
        const item = get().items.find(i => i.cartItemId === cartItemId);
        if (!item) return;
        get().setQuantity(cartItemId, item.quantity + 1);
      },

      decrementQuantity: cartItemId => {
        const item = get().items.find(i => i.cartItemId === cartItemId);
        if (!item) return;
        get().setQuantity(cartItemId, item.quantity - 1);
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + getUnitPrice(item) * item.quantity,
          0
        ),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ items: state.items }),
      version: 1,
    }
  )
);
