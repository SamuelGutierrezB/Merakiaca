import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion,
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

export async function deleteAllOrders(): Promise<number> {
  try {
    const ordersRef = collection(db, FIREBASE_COLLECTIONS.ORDERS);
    const querySnapshot = await getDocs(ordersRef);

    if (querySnapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((orderDoc) => {
      batch.delete(orderDoc.ref);
    });

    await batch.commit();
    return querySnapshot.size;
  } catch (error) {
    console.error("Error deleting all orders:", error);
    throw new Error("Error al eliminar todas las órdenes");
  }
}

/**
 * Actualiza el estado de pago de una orden
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  mercadoPagoPaymentId?: string,
  changedBy?: string,
  note?: string,
): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);
    const orderSnapshot = await getDoc(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden no existe");
    }

    const currentOrder = orderSnapshot.data() as Order;
    const isAlreadyApproved = currentOrder.paymentStatus === "approved";
    const paymentStatusChanged = currentOrder.paymentStatus !== paymentStatus;

    const now = new Date();
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (paymentStatusChanged) {
      updateData.paymentStatus = paymentStatus;
      updateData.paymentStatusHistory = arrayUnion({
        paymentStatus,
        changedAt: now,
        changedBy: changedBy || null,
        note: note || null,
      });
    }

    if (
      mercadoPagoPaymentId &&
      currentOrder.mercadoPagoPaymentId !== mercadoPagoPaymentId
    ) {
      updateData.mercadoPagoPaymentId = mercadoPagoPaymentId;
    }

    if (paymentStatus === "approved" && !isAlreadyApproved) {
      updateData.status = "processing";
      updateData.statusHistory = arrayUnion({
        status: "processing",
        changedAt: now,
        changedBy: null,
        note: "Estado actualizado automáticamente al aprobar el pago",
      });
    }

    if (Object.keys(updateData).length > 1) {
      await updateDoc(orderRef, updateData);
    }

    if (paymentStatus === "approved" && !isAlreadyApproved) {
      for (const item of currentOrder.items) {
        await reduceProductFabricStock(
          item.productId,
          item.fabricId,
          item.quantity,
        );
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
  changedBy?: string,
  note?: string,
): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);

    // Crear entrada de historial usando Date en lugar de Timestamp para arrayUnion
    const historyEntry: any = {
      status,
      changedAt: new Date(),
      changedBy: changedBy || null,
      note: note || null,
    };

    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(historyEntry),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Error al actualizar el estado de la orden");
  }
}

/**
 * Guarda el ID de preferencia de Mercado Pago en la orden.
 */
export async function updateOrderPreferenceId(
  orderId: string,
  preferenceId: string,
): Promise<void> {
  try {
    const orderRef = doc(db, FIREBASE_COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      mercadoPagoPreferenceId: preferenceId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving preferenceId:", error);
    throw new Error("Error al guardar la preferencia de pago");
  }
}
