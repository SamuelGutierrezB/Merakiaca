import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";
import type {
  Order,
  CreateOrderData,
  OrderStatus,
  PaymentStatus,
} from "@/types/order.types";
import { reduceProductFabricStock } from "./products.service";

export async function createOrder(
  userId: string,
  orderData: CreateOrderData,
): Promise<string> {
  try {
    const now = Timestamp.now();

    const order: Omit<Order, "id"> = {
      userId,
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      shipping: orderData.shipping,
      total: orderData.total,
      status: "pending",
      paymentStatus: "pending", // Iniciar como pendiente
      shippingAddress: orderData.shippingAddress,
      paymentMethod: "mercadopago",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(
      collection(db, FIREBASE_COLLECTIONS.ORDERS),
      order,
    );

    // NO reducir el stock aquí - se reducirá cuando el pago sea aprobado

    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Error al crear la orden");
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.ORDERS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("Error al obtener las órdenes");
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.ORDERS),
      orderBy("createdAt", "desc"),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw new Error("Error al obtener las órdenes");
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Error al eliminar la orden");
  }
}

/**
 * Actualiza el estado de pago de una orden
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  mercadoPagoPaymentId?: string,
): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);
    const updateData: any = {
      paymentStatus,
      updatedAt: serverTimestamp(),
    };

    if (mercadoPagoPaymentId) {
      updateData.mercadoPagoPaymentId = mercadoPagoPaymentId;
    }

    // Si el pago es aprobado, actualizar el estado de la orden
    if (paymentStatus === "approved") {
      updateData.status = "processing";
    }

    await updateDoc(orderRef, updateData);

    // Si el pago es aprobado, reducir el stock
    if (paymentStatus === "approved") {
      const orders = await getAllOrders();
      const order = orders.find((o) => o.id === orderId);

      if (order) {
        for (const item of order.items) {
          await reduceProductFabricStock(
            item.productId,
            item.fabricId,
            item.quantity,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Error al actualizar el estado de pago");
  }
}

/**
 * Actualiza el estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Error al actualizar el estado de la orden");
  }
}
