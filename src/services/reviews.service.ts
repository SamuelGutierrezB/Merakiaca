import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Review, ReviewFormData } from "@/types";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";

/**
 * Obtiene todas las reseñas de un producto
 */
export const getProductReviews = async (
  productId: string,
): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, FIREBASE_COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    throw error;
  }
};

/**
 * Obtiene las reseñas de un usuario para un producto específico
 */
export const getUserProductReviews = async (
  userId: string,
  productId: string,
): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, FIREBASE_COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where("userId", "==", userId),
      where("productId", "==", productId),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error("Error al obtener reseñas del usuario:", error);
    throw error;
  }
};

/**
 * Crea una nueva reseña
 */
export const createReview = async (
  productId: string,
  userId: string,
  userName: string,
  data: ReviewFormData,
): Promise<string> => {
  try {
    const reviewsRef = collection(db, FIREBASE_COLLECTIONS.REVIEWS);
    const docRef = await addDoc(reviewsRef, {
      productId,
      userId,
      userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error al crear reseña:", error);
    throw error;
  }
};

/**
 * Actualiza una reseña existente
 */
export const updateReview = async (
  reviewId: string,
  data: Partial<ReviewFormData>,
): Promise<void> => {
  try {
    const reviewRef = doc(db, FIREBASE_COLLECTIONS.REVIEWS, reviewId);
    await updateDoc(reviewRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    throw error;
  }
};

/**
 * Elimina una reseña
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    const reviewRef = doc(db, FIREBASE_COLLECTIONS.REVIEWS, reviewId);
    await deleteDoc(reviewRef);
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    throw error;
  }
};

/**
 * Calcula el promedio de calificación de un producto
 */
export const getProductRating = async (
  productId: string,
): Promise<{ average: number; count: number }> => {
  try {
    const reviews = await getProductReviews(productId);

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;

    return {
      average: Math.round(average * 10) / 10, // Redondear a 1 decimal
      count: reviews.length,
    };
  } catch (error) {
    console.error("Error al calcular calificación:", error);
    throw error;
  }
};
