import { Timestamp } from "firebase/firestore";

export type DiscountCodeType = "percentage" | "fixed_amount";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountCodeType;
  value: number;
  isActive: boolean;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxUses: number;
  currentUses: number;
  maxUsesPerUser?: number;
  startsAt?: Timestamp;
  endsAt?: Timestamp;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Métricas
  validationAttempts?: number; // total de intentos de validación
  validationSuccesses?: number; // validaciones exitosas
  totalRedemptions?: number; // canjes exitosos
  totalDiscountGiven?: number; // suma en MXN de descuentos otorgados
}

export interface AppliedDiscount {
  codeId: string;
  code: string;
  type: DiscountCodeType;
  value: number;
  discountAmount: number;
  subtotal: number;
  totalAfterDiscount: number;
}
