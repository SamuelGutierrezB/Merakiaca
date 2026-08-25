import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/services/notifications.service";
import { useAuthStore } from "@/store/authStore";
import { FIREBASE_COLLECTIONS, ROUTES } from "@/utils/constants";
import type { AdminNotification, AdminNotificationType } from "@/types";

const NOTIFICATION_LINKS: Record<AdminNotificationType, string> = {
  sale: ROUTES.ADMIN.ORDERS,
  payment_rejected: ROUTES.ADMIN.ORDERS,
  new_order: ROUTES.ADMIN.ORDERS,
  low_stock: ROUTES.ADMIN.PRODUCTS,
};

export default function NotificationBell() {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(
    typeof Notification !== "undefined" &&
      Notification.permission !== "default",
  );

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(
        snapshot.docs.map(
          (docSnap) =>
            ({ id: docSnap.id, ...docSnap.data() }) as AdminNotification,
        ),
      );
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let cancelled = false;

    onForegroundMessage((title, body) => {
      toast(`${title}: ${body}`);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
      } else {
        unsubscribeForeground = unsub;
      }
    });

    return () => {
      cancelled = true;
      unsubscribeForeground?.();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleActivate = async () => {
    if (!user) return;
    await requestNotificationPermission(user.uid);
    setPermissionAsked(true);
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    await updateDoc(
      doc(db, FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS, notification.id),
      { read: true },
    );
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {!permissionAsked && (
            <button
              onClick={handleActivate}
              className="w-full text-left px-4 py-3 text-sm text-[#2391C3] font-semibold border-b border-gray-200 dark:border-gray-700"
            >
              Activar notificaciones
            </button>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Sin notificaciones
              </p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={NOTIFICATION_LINKS[notification.type]}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    notification.read ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notification.body}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
