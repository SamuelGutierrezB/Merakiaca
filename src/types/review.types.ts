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
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}
