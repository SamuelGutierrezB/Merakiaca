import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { FrequentCustomerCode } from "@/types";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";

/**
 * Valida un código de cliente frecuente
 */
export const validateFrequentCustomerCode = async (
  code: string,
): Promise<{ isValid: boolean; codeId?: string; message?: string }> => {
  try {
    const codesRef = collection(
      db,
      FIREBASE_COLLECTIONS.FREQUENT_CUSTOMER_CODES,
    );
    const q = query(codesRef, where("code", "==", code.trim().toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { isValid: false, message: "Código no válido" };
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data() as FrequentCustomerCode;

    if (!codeData.isActive) {
      return { isValid: false, message: "Este código está desactivado" };
    }

    if (codeData.currentUses >= codeData.maxUses) {
      return {
        isValid: false,
        message: "Este código ha alcanzado el límite de usos",
      };
    }

    return { isValid: true, codeId: codeDoc.id };
  } catch (error) {
    console.error("Error al validar código:", error);
    return { isValid: false, message: "Error al validar el código" };
  }
};

/**
 * Registra el uso de un código de cliente frecuente
 */
export const registerCodeUsage = async (
  codeId: string,
  userId: string,
): Promise<void> => {
  try {
    const codeRef = doc(
      db,
      FIREBASE_COLLECTIONS.FREQUENT_CUSTOMER_CODES,
      codeId,
    );

    await updateDoc(codeRef, {
      currentUses: increment(1),
      usedBy: arrayUnion(userId),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error al registrar uso de código:", error);
    throw error;
  }
};

/**
 * Verifica si un usuario ya ha usado un código específico
 */
export const hasUserUsedCode = async (
  code: string,
  userId: string,
): Promise<boolean> => {
  try {
    const codesRef = collection(
      db,
      FIREBASE_COLLECTIONS.FREQUENT_CUSTOMER_CODES,
    );
    const q = query(codesRef, where("code", "==", code.trim().toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return false;
    }

    const codeData = snapshot.docs[0].data() as FrequentCustomerCode;
    return codeData.usedBy.includes(userId);
  } catch (error) {
    console.error("Error al verificar uso de código:", error);
    return false;
  }
};

/**
 * Obtiene todos los códigos activos (solo para admin)
 */
export const getAllFrequentCustomerCodes = async (): Promise<
  FrequentCustomerCode[]
> => {
  try {
    const codesRef = collection(
      db,
      FIREBASE_COLLECTIONS.FREQUENT_CUSTOMER_CODES,
    );
    const snapshot = await getDocs(codesRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FrequentCustomerCode[];
  } catch (error) {
    console.error("Error al obtener códigos:", error);
    throw error;
  }
};
