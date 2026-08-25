import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { app, db } from "./firebase";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";

async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  return getMessaging(app);
}

/**
 * Pide permiso de notificaciones, obtiene el token FCM y lo guarda
 * en users/{userId}.fcmTokens (soporta múltiples dispositivos).
 */
export async function requestNotificationPermission(
  userId: string,
): Promise<boolean> {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  if (!token) {
    return false;
  }

  const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
  await updateDoc(userRef, { fcmTokens: arrayUnion(token) });

  return true;
}

/**
 * Escucha pushes de FCM cuando el panel está abierto en primer plano.
 */
export async function onForegroundMessage(
  callback: (title: string, body: string) => void,
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload.notification?.title || "", payload.notification?.body || "");
  });
}
