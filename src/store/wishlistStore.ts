import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getUserWishlist,
  addToWishlist as addToWishlistService,
  removeFromWishlist as removeFromWishlistService,
} from "@/services/wishlist.service";
import toast from "react-hot-toast";

interface WishlistStore {
  wishlist: string[]; // Array de productIds
  isLoading: boolean;
  loadWishlist: (userId: string) => Promise<void>;
  addToWishlist: (userId: string, productId: string) => Promise<void>;
  removeFromWishlist: (userId: string, productId: string) => Promise<void>;
  toggleWishlist: (userId: string, productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlist: [],
      isLoading: false,

      loadWishlist: async (userId: string) => {
        try {
          set({ isLoading: true });
          const wishlist = await getUserWishlist(userId);
          set({ wishlist });
        } catch (error) {
          console.error("Error loading wishlist:", error);
          toast.error("Error al cargar favoritos");
        } finally {
          set({ isLoading: false });
        }
      },

      addToWishlist: async (userId: string, productId: string) => {
        try {
          await addToWishlistService(userId, productId);
          set((state) => ({
            wishlist: [...state.wishlist, productId],
          }));
          toast.success("Agregado a favoritos");
        } catch (error) {
          console.error("Error adding to wishlist:", error);
          toast.error("Error al agregar a favoritos");
        }
      },

      removeFromWishlist: async (userId: string, productId: string) => {
        try {
          await removeFromWishlistService(userId, productId);
          set((state) => ({
            wishlist: state.wishlist.filter((id) => id !== productId),
          }));
          toast.success("Eliminado de favoritos");
        } catch (error) {
          console.error("Error removing from wishlist:", error);
          toast.error("Error al eliminar de favoritos");
        }
      },

      toggleWishlist: async (userId: string, productId: string) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(productId)) {
          await removeFromWishlist(userId, productId);
        } else {
          await addToWishlist(userId, productId);
        }
      },

      isInWishlist: (productId: string) => {
        return get().wishlist.includes(productId);
      },

      clearWishlist: () => {
        set({ wishlist: [] });
      },
    }),
    {
      name: "wishlist-storage",
    },
  ),
);
