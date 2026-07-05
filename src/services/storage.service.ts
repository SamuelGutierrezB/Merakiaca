import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import type { UploadMetadata } from "firebase/storage";
import { storage } from "./firebase";

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_WEBP_QUALITY = 0.82;
const CACHE_CONTROL_HEADER = "public,max-age=31536000,immutable";

const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const splitFileName = (
  fileName: string,
): { baseName: string; extension: string } => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex),
  };
};

const loadImageFromFile = (
  file: File,
): Promise<{ image: HTMLImageElement; objectUrl: string }> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen para comprimir"));
    };

    image.src = objectUrl;
  });
};

const shouldCompressImage = (file: File): boolean => {
  if (!file.type.startsWith("image/")) return false;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return false;
  return true;
};

const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!shouldCompressImage(file)) {
    return file;
  }

  try {
    const { image, objectUrl } = await loadImageFromFile(file);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    const scale = Math.min(
      1,
      IMAGE_MAX_DIMENSION / Math.max(originalWidth, originalHeight),
    );
    const targetWidth = Math.max(1, Math.round(originalWidth * scale));
    const targetHeight = Math.max(1, Math.round(originalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      URL.revokeObjectURL(objectUrl);
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", IMAGE_WEBP_QUALITY);
    });

    URL.revokeObjectURL(objectUrl);

    if (!compressedBlob) {
      return file;
    }

    if (compressedBlob.size >= file.size) {
      return file;
    }

    const { baseName } = splitFileName(file.name);
    const compressedName = `${baseName || "image"}.webp`;

    const compressedFile = new File([compressedBlob], compressedName, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return compressedFile;
  } catch {
    return file;
  }
};

const buildStoragePath = (folder: string, file: File): string => {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name);
  return `${folder}/${timestamp}_${safeName}`;
};

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
      cacheControl: CACHE_CONTROL_HEADER,
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
    const processedFile = await compressImageIfNeeded(file);
    const folder = productId ? `products/${productId}` : "products/temp";
    const path = buildStoragePath(folder, processedFile);

    return await uploadImage(processedFile, path);
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
    const processedFile = await compressImageIfNeeded(file);
    const folder = `fabrics/${productId}${fabricId ? `/${fabricId}` : ""}`;
    const path = buildStoragePath(folder, processedFile);

    return await uploadImage(processedFile, path);
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
    const uploadPromises = files.map(async (file, index) => {
      const processedFile = await compressImageIfNeeded(file);
      const path = `${basePath}/${Date.now()}_${index}_${sanitizeFileName(processedFile.name)}`;
      return uploadImage(processedFile, path);
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
