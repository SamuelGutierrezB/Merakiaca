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
