import { Timestamp } from "firebase/firestore";

export type AdminNotificationType =
  | "sale"
  | "payment_rejected"
  | "new_order"
  | "low_stock";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  orderId?: string;
  productId?: string;
  read: boolean;
  createdAt: Timestamp;
}
