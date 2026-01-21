import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";
import type { Order, CreateOrderData } from "@/types/order.types";

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
      paymentStatus: "approved", // Como es gratis, aprobamos automáticamente
      shippingAddress: orderData.shippingAddress,
      paymentMethod: "mercadopago",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(
      collection(db, FIREBASE_COLLECTIONS.ORDERS),
      order,
    );

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
