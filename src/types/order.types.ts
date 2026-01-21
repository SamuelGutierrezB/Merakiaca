import { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  fabricId: string;
  fabricName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  paymentMethod: "mercadopago";
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
