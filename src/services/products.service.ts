import {
  collection,
  doc,
  getDoc,
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
import type { Product, ProductFormData, FabricOption } from "@/types";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";

/**
 * Obtiene todos los productos
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, FIREBASE_COLLECTIONS.PRODUCTS);
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

/**
 * Obtiene solo productos activos
 * Nota: Ordena en el cliente para evitar necesitar índice compuesto
 */
export const getActiveProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, FIREBASE_COLLECTIONS.PRODUCTS);
    // Temporalmente sin orderBy para evitar necesitar índice compuesto
    const q = query(productsRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Ordenar en el cliente
    return products.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime; // Descendente (más reciente primero)
    });
  } catch (error) {
    console.error("Error al obtener productos activos:", error);
    throw error;
  }
};

/**
 * Obtiene un producto por ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);
    const snapshot = await getDoc(productRef);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Product;
    }

    return null;
  } catch (error) {
    console.error("Error al obtener producto:", error);
    throw error;
  }
};

/**
 * Crea un nuevo producto
 */
export const createProduct = async (
  productData: ProductFormData,
): Promise<string> => {
  try {
    const productsRef = collection(db, FIREBASE_COLLECTIONS.PRODUCTS);

    const newProduct = {
      ...productData,
      mainImage: "",
      images: [],
      fabrics: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(productsRef, newProduct);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear producto:", error);
    throw error;
  }
};

/**
 * Actualiza un producto existente
 */
export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
): Promise<void> => {
  try {
    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);

    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

/**
 * Elimina un producto
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};

/**
 * Actualiza la imagen principal de un producto
 */
export const updateProductMainImage = async (
  id: string,
  imageUrl: string,
): Promise<void> => {
  try {
    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);
    await updateDoc(productRef, {
      mainImage: imageUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar imagen principal:", error);
    throw error;
  }
};

/**
 * Agrega imágenes a la galería de un producto
 */
export const addProductImages = async (
  id: string,
  imageUrls: string[],
): Promise<void> => {
  try {
    const product = await getProductById(id);
    if (!product) throw new Error("Producto no encontrado");

    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);
    await updateDoc(productRef, {
      images: [...product.images, ...imageUrls],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al agregar imágenes:", error);
    throw error;
  }
};

/**
 * Busca productos por categoría
 */
export const getProductsByCategory = async (
  category: string,
): Promise<Product[]> => {
  try {
    const productsRef = collection(db, FIREBASE_COLLECTIONS.PRODUCTS);
    const q = query(
      productsRef,
      where("category", "==", category),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error al buscar productos por categoría:", error);
    throw error;
  }
};

/**
 * Actualiza las opciones de tela de un producto
 */
export const updateProductFabrics = async (
  id: string,
  fabrics: FabricOption[],
): Promise<void> => {
  try {
    const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, id);
    await updateDoc(productRef, {
      fabrics,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar opciones de tela:", error);
    throw error;
  }
};
