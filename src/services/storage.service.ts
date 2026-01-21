import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import type { UploadMetadata } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Sube una imagen a Firebase Storage
 */
export const uploadImage = async (
  file: File,
  path: string,
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const metadata: UploadMetadata = {
      contentType: file.type,
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }
};

/**
 * Sube una imagen de producto a Firebase Storage
 */
export const uploadProductImage = async (
  file: File,
  productId?: string,
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const folder = productId ? `products/${productId}` : "products/temp";
    const path = `${folder}/${filename}`;

    return await uploadImage(file, path);
  } catch (error) {
    console.error("Error al subir imagen de producto:", error);
    throw error;
  }
};

/**
 * Sube una imagen de patrón/tela a Firebase Storage
 */
export const uploadFabricImage = async (
  file: File,
  productId: string,
  fabricId?: string,
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const folder = `fabrics/${productId}${fabricId ? `/${fabricId}` : ""}`;
    const path = `${folder}/${filename}`;

    return await uploadImage(file, path);
  } catch (error) {
    console.error("Error al subir imagen de tela:", error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes
 */
export const uploadMultipleImages = async (
  files: File[],
  basePath: string,
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => {
      const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
      return uploadImage(file, path);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error al subir múltiples imágenes:", error);
    throw error;
  }
};

/**
 * Elimina una imagen de Firebase Storage
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    throw error;
  }
};

/**
 * Genera un path único para una imagen
 */
export const generateImagePath = (folder: string, fileName: string): string => {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
  return `${folder}/${timestamp}_${cleanFileName}`;
};
