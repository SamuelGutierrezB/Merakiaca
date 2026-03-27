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
    console.log("createProduct: called with productData:", productData);
    const productsRef = collection(db, FIREBASE_COLLECTIONS.PRODUCTS);
    console.log("createProduct: productsRef:", productsRef);

    const newProduct = {
      ...productData,
      description:
        !productData.description || productData.description.trim() === ""
          ? "sin descripcion"
          : productData.description,
      mainImage: "",
      images: [],
      fabrics: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    console.log("createProduct: newProduct object:", newProduct);

    const docRef = await addDoc(productsRef, newProduct);
    console.log("createProduct: document added with id:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("createProduct: Error al crear producto:", error);
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
      description:
        !productData.description || productData.description.trim() === ""
          ? "sin descripcion"
          : productData.description,
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

    // Primero obtenemos todos los productos activos
    const q = query(productsRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    // Filtramos en el cliente para soportar tanto category como categories
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Filtrar productos que tienen la categoría buscada
    return products
      .filter((product) => {
        // Verificar si tiene el array categories
        if (product.categories && product.categories.length > 0) {
          return product.categories.includes(category);
        }
        // Fallback al campo category antiguo
        return product.category === category;
      })
      .sort((a, b) => {
        // Ordenar por fecha de creación (más recientes primero)
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
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

/**
 * Reduce el stock de una tela específica de un producto
 */
export const reduceProductFabricStock = async (
  productId: string,
  fabricId: string,
  quantity: number,
): Promise<void> => {
  try {
    // Obtener el producto actual
    const product = await getProductById(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    // Buscar la tela y reducir su stock
    const updatedFabrics = product.fabrics.map((fabric) => {
      if (fabric.id === fabricId) {
        const newStock = Math.max(0, fabric.stock - quantity);
        return { ...fabric, stock: newStock };
      }
      return fabric;
    });

    // Actualizar el producto con los nuevos stocks
    await updateProductFabrics(productId, updatedFabrics);
  } catch (error) {
    console.error("Error al reducir stock de tela:", error);
    throw error;
  }
};
