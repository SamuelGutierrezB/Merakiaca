import { Timestamp } from "firebase/firestore";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 estrellas
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  frequentCustomerCode?: string; // Código de cliente frecuente usado para comentar sin compra
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export interface FrequentCustomerCode {
  id: string;
  code: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  usedBy: string[]; // Array de userIds o identificadores temporales
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
