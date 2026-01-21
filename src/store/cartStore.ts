import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  loading: boolean;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, fabricId: string) => void;
  updateQuantity: (
    productId: string,
    fabricId: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      addItem: (item) => {
        const quantity = item.quantity || 1;
        const newItem: CartItem = { ...item, quantity };

        set((state) => {
          // Verificar si el producto con la misma tela ya existe
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.productId === newItem.productId &&
              i.fabricId === newItem.fabricId,
          );

          if (existingItemIndex !== -1) {
            // Actualizar cantidad si ya existe
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return { items: updatedItems };
          } else {
            // Agregar nuevo item
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (productId, fabricId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.fabricId === fabricId),
          ),
        }));
      },

      updateQuantity: (productId, fabricId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, fabricId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.fabricId === fabricId
              ? { ...item, quantity }
              : item,
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.priceAtAdd * item.quantity,
          0,
        );
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "merakiaca-cart",
    },
  ),
);
