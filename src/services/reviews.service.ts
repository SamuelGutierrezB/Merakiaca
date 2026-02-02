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
    console.log(
      "🔍 [getProductReviews] Buscando reseñas para productId:",
      productId,
    );
    const reviewsRef = collection(db, FIREBASE_COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
    );
    console.log("📡 [getProductReviews] Ejecutando query...");
    const snapshot = await getDocs(q);
    console.log("📦 [getProductReviews] Documentos obtenidos:", snapshot.size);

    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📄 [getProductReviews] Doc raw data:", doc.id, data);
      const review = {
        id: doc.id,
        ...data,
        // Convertir timestamps de Firestore a Date si es necesario
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      };
      console.log("✅ [getProductReviews] Review procesada:", review);
      return review;
    }) as Review[];

    console.log(
      "🎯 [getProductReviews] Total reviews encontradas:",
      reviews.length,
      reviews,
    );
    return reviews;
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

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      };
    }) as Review[];
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
  frequentCustomerCode?: string,
): Promise<string> => {
  try {
    const reviewsRef = collection(db, FIREBASE_COLLECTIONS.REVIEWS);
    const now = new Date();
    const reviewData: any = {
      productId,
      userId,
      userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    };

    // Solo agregar el código si fue proporcionado
    if (frequentCustomerCode) {
      reviewData.frequentCustomerCode = frequentCustomerCode;
    }

    const docRef = await addDoc(reviewsRef, reviewData);

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
      updatedAt: new Date(),
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
