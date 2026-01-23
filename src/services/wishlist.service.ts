import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";
import type { WishlistItem } from "@/types/wishlist.types";

/**
 * Obtiene la lista de favoritos del usuario
 */
export async function getUserWishlist(userId: string): Promise<string[]> {
  try {
    const wishlistRef = doc(db, FIREBASE_COLLECTIONS.WISHLISTS, userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      return [];
    }

    const data = wishlistDoc.data();
    return data.items?.map((item: WishlistItem) => item.productId) || [];
  } catch (error) {
    console.error("Error getting wishlist:", error);
    throw new Error("Error al obtener la lista de favoritos");
  }
}

/**
 * Agrega un producto a la lista de favoritos
 */
export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<void> {
  try {
    const wishlistRef = doc(db, FIREBASE_COLLECTIONS.WISHLISTS, userId);
    const wishlistDoc = await getDoc(wishlistRef);

    const newItem: WishlistItem = {
      productId,
      addedAt: Timestamp.now() as any,
    };

    if (!wishlistDoc.exists()) {
      // Crear nueva lista de favoritos
      await setDoc(wishlistRef, {
        userId,
        items: [newItem],
        updatedAt: Timestamp.now(),
      });
    } else {
      // Agregar a lista existente
      await updateDoc(wishlistRef, {
        items: arrayUnion(newItem),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw new Error("Error al agregar a favoritos");
  }
}

/**
 * Elimina un producto de la lista de favoritos
 */
export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<void> {
  try {
    const wishlistRef = doc(db, FIREBASE_COLLECTIONS.WISHLISTS, userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      return;
    }

    const data = wishlistDoc.data();
    const itemToRemove = data.items?.find(
      (item: WishlistItem) => item.productId === productId,
    );

    if (itemToRemove) {
      await updateDoc(wishlistRef, {
        items: arrayRemove(itemToRemove),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw new Error("Error al eliminar de favoritos");
  }
}

/**
 * Verifica si un producto está en la lista de favoritos
 */
export async function isInWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const wishlist = await getUserWishlist(userId);
    return wishlist.includes(productId);
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

/**
 * Limpia toda la lista de favoritos del usuario
 */
export async function clearWishlist(userId: string): Promise<void> {
  try {
    const wishlistRef = doc(db, FIREBASE_COLLECTIONS.WISHLISTS, userId);
    await updateDoc(wishlistRef, {
      items: [],
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    throw new Error("Error al limpiar la lista de favoritos");
  }
}
