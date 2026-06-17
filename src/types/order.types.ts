import { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface StatusHistory {
  status: OrderStatus;
  changedAt: Timestamp;
  changedBy?: string; // userId del admin que hizo el cambio, undefined si fue automático
  note?: string; // nota opcional del cambio
}

export interface PaymentStatusHistory {
  paymentStatus: PaymentStatus;
  changedAt: Timestamp;
  changedBy?: string;
  note?: string;
}

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
  discountCode?: string;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  discountAmount?: number;
  totalBeforeDiscount?: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  statusHistory?: StatusHistory[]; // Historial de cambios de estado
  paymentStatusHistory?: PaymentStatusHistory[]; // Historial de cambios de pago
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
  discountSnapshot?: {
    codeId: string;
    code: string;
    type: "percentage" | "fixed_amount";
    value: number;
    discountAmount: number;
    subtotal: number;
    totalAfterDiscount: number;
  };
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
