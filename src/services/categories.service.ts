import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";
import type { Category } from "@/types/category.types";

export async function getAllCategories(): Promise<Category[]> {
  try {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.CATEGORIES),
      orderBy("order", "asc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Error al obtener las categorías");
  }
}

export async function createCategory(
  data: Omit<Category, "id">,
): Promise<string> {
  try {
    const docRef = await addDoc(
      collection(db, FIREBASE_COLLECTIONS.CATEGORIES),
      data,
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Error al crear la categoría");
  }
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>,
): Promise<void> {
  try {
    const categoryRef = doc(db, FIREBASE_COLLECTIONS.CATEGORIES, id);
    await updateDoc(categoryRef, data);
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Error al actualizar la categoría");
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const categoryRef = doc(db, FIREBASE_COLLECTIONS.CATEGORIES, id);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Error al eliminar la categoría");
  }
}
