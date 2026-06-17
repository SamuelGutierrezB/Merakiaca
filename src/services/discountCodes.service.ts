import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";
import type { DiscountCode, AppliedDiscount, DiscountCodeType } from "@/types";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";

const VALIDATE_DISCOUNT_CODE_URL =
  "https://us-central1-merakiaca-3a05a.cloudfunctions.net/validateDiscountCode";
const APPLY_DISCOUNT_CODE_URL =
  "https://us-central1-merakiaca-3a05a.cloudfunctions.net/applyDiscountCode";

interface CreateDiscountCodeInput {
  code: string;
  type: DiscountCodeType;
  value: number;
  maxUses: number;
  maxUsesPerUser?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

async function getUserIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  return user.getIdToken();
}

export async function validateDiscountCode(
  code: string,
  subtotal: number,
): Promise<AppliedDiscount> {
  const idToken = await getUserIdToken();

  const response = await fetch(VALIDATE_DISCOUNT_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ code, subtotal }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error al validar el codigo" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function applyDiscountCode(
  orderId: string,
  code: string,
  discountAmount: number,
  totalAfterDiscount: number,
): Promise<{ success: boolean; message: string; redemptionId: string }> {
  const idToken = await getUserIdToken();

  const response = await fetch(APPLY_DISCOUNT_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      orderId,
      code,
      discountAmount,
      totalAfterDiscount,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error al aplicar el codigo" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  try {
    const codesRef = collection(db, FIREBASE_COLLECTIONS.DISCOUNT_CODES);
    const snapshot = await getDocs(codesRef);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as DiscountCode[];
  } catch (error) {
    console.error("Error al obtener codigos de descuento:", error);
    throw error;
  }
}

export async function createDiscountCode(
  input: CreateDiscountCodeInput,
): Promise<string> {
  try {
    const normalizedCode = input.code.trim().toUpperCase();
    if (!normalizedCode) {
      throw new Error("El codigo es obligatorio");
    }

    if (
      input.type === "percentage" &&
      (input.value <= 0 || input.value > 100)
    ) {
      throw new Error("El descuento en porcentaje debe estar entre 1 y 100");
    }

    if (input.type === "fixed_amount" && input.value <= 0) {
      throw new Error("El descuento fijo debe ser mayor a 0");
    }

    const codesRef = collection(db, FIREBASE_COLLECTIONS.DISCOUNT_CODES);
    const q = query(codesRef, where("code", "==", normalizedCode));
    const existing = await getDocs(q);

    if (!existing.empty) {
      throw new Error("Este codigo ya existe");
    }

    const docRef = await addDoc(codesRef, {
      code: normalizedCode,
      type: input.type,
      value: Number(input.value),
      isActive: true,
      maxUses: Number(input.maxUses),
      currentUses: 0,
      maxUsesPerUser: Number(input.maxUsesPerUser || 1),
      minPurchaseAmount:
        typeof input.minPurchaseAmount === "number"
          ? Number(input.minPurchaseAmount)
          : null,
      maxDiscountAmount:
        typeof input.maxDiscountAmount === "number"
          ? Number(input.maxDiscountAmount)
          : null,
      startsAt: input.startsAt || null,
      endsAt: input.endsAt || null,
      createdBy: getAuth().currentUser?.uid || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error al crear codigo de descuento:", error);
    throw error;
  }
}

export async function toggleDiscountCodeStatus(
  codeId: string,
  isActive: boolean,
): Promise<void> {
  try {
    const codeRef = doc(db, FIREBASE_COLLECTIONS.DISCOUNT_CODES, codeId);
    await updateDoc(codeRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar estado del codigo:", error);
    throw error;
  }
}

export async function deleteDiscountCode(codeId: string): Promise<void> {
  try {
    const codeRef = doc(db, FIREBASE_COLLECTIONS.DISCOUNT_CODES, codeId);
    await deleteDoc(codeRef);
  } catch (error) {
    console.error("Error al eliminar codigo de descuento:", error);
    throw error;
  }
}
