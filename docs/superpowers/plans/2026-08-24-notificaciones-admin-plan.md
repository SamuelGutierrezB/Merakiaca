# Notificaciones Push al Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El admin recibe un push notification en su teléfono cuando se aprueba una venta, se rechaza un pago, se crea una orden nueva sin pagar, o el stock de una tela baja a ≤3 unidades — con un historial de estos eventos en una campanita dentro del panel admin.

**Architecture:** Firebase Cloud Messaging (Web Push) sobre la infraestructura Firebase ya existente. Un módulo backend compartido (`notifyAdmins`) escribe cada evento en la colección `adminNotifications` y manda el push a los tokens FCM de los usuarios con `role: "admin"`. Se engancha en 3 puntos: dentro de `applyOrderPaymentUpdate` (venta/pago rechazado, ya existente), y dos triggers nuevos de Firestore (`onOrderCreated`, `onProductStockChanged`). En el frontend, un componente `NotificationBell` en el `Header` muestra el historial en tiempo real y activa el permiso de push.

**Tech Stack:** Firebase Cloud Functions (Node 22, `firebase-functions` v6 v2 triggers), Firebase Admin SDK (`firebase-admin` v13, `firebase-admin/messaging`), Firestore, React 19 + TypeScript, `firebase/messaging` (cliente web, ya incluido en el paquete `firebase` v12.8.0 — no requiere dependencia nueva).

## Global Constraints

- Región de todas las Cloud Functions: `us-central1` (consistente con `mpWebhook`, `mpCreatePreference`).
- Umbral de stock bajo: se notifica solo al **cruzar** de >3 a ≤3 unidades, nunca en cada write mientras siga bajo.
- Historial de campanita: últimas 20 notificaciones (`orderBy("createdAt", "desc")`, `limit(20)`).
- No se agregan proveedores externos (solo FCM, sobre el proyecto Firebase existente `merakiaca-3a05a`).
- No hay test runner en el repo — verificación vía Firebase emulators (`firebase emulators:start`) y chequeo manual en navegador, no se agregan frameworks de testing nuevos.
- TypeScript strict mode, sin `any`, path alias `@/*` para imports del cliente.
- Archivos nuevos de Functions se mantienen enfocados (una responsabilidad cada uno) en vez de seguir creciendo `functions/index.js`.
- Nunca editar `.env.local`.
- Los `deploy` de Firestore rules y Cloud Functions **no se ejecutan como parte de este plan** — son el paso manual final que corre el usuario.
- Mensajes de commit en inglés, imperativos, sin `Co-Authored-By`.

---

### Task 1: Modelo de datos — tipos TypeScript y reglas de Firestore

**Files:**
- Create: `src/types/notification.types.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/user.types.ts`
- Modify: `src/utils/constants.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Produces: `AdminNotificationType` (`"sale" | "payment_rejected" | "new_order" | "low_stock"`), `AdminNotification` interface (`id`, `type`, `title`, `body`, `orderId?`, `productId?`, `read`, `createdAt`), `User.fcmTokens?: string[]`, `FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS`.

- [ ] **Step 1: Crear el tipo `AdminNotification`**

Crea `src/types/notification.types.ts`:

```ts
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
```

- [ ] **Step 2: Exportar el nuevo tipo desde el índice**

En `src/types/index.ts`, agrega la línea de re-export (después de `wishlist.types`):

```ts
export * from "./notification.types";
```

- [ ] **Step 3: Agregar `fcmTokens` al tipo `User`**

En `src/types/user.types.ts`, agrega el campo a la interfaz `User` (después de `role`):

```ts
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  fcmTokens?: string[];
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

- [ ] **Step 4: Agregar la colección a `FIREBASE_COLLECTIONS`**

En `src/utils/constants.ts`, agrega la línea dentro del objeto (después de `FREQUENT_CUSTOMER_CODES`):

```ts
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  CARTS: "carts",
  ORDERS: "orders",
  REVIEWS: "reviews",
  WISHLISTS: "wishlists",
  FREQUENT_CUSTOMER_CODES: "frequentCustomerCodes",
  ADMIN_NOTIFICATIONS: "adminNotifications",
};
```

- [ ] **Step 5: Agregar reglas de Firestore para `adminNotifications`**

En `firestore.rules`, agrega este bloque nuevo después del bloque `frequentCustomerCodes` (antes de la `REGLA POR DEFECTO`):

```
    // ============================================
    // COLECCIÓN: adminNotifications
    // ============================================
    match /adminNotifications/{notificationId} {
      // Solo admins pueden leer el historial de notificaciones
      allow read: if isAdmin() || isAdminEmail();

      // Solo admins pueden marcar como leído (update)
      allow update: if isAdmin() || isAdminEmail();

      // Solo Cloud Functions (Admin SDK) puede crear/eliminar — bypassa reglas
      allow create, delete: if false;
    }
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores (exit code 0).

- [ ] **Step 7: Verificar sintaxis de las reglas con el emulador**

Run: `npx firebase-tools emulators:start --only firestore` (Ctrl+C para detener una vez que veas `✔  firestore: Emulator started`)
Expected: el emulador arranca sin error de parseo en `firestore.rules`. Si tira un error de sintaxis, corrígelo antes de continuar.

- [ ] **Step 8: Commit**

```bash
git add src/types/notification.types.ts src/types/index.ts src/types/user.types.ts src/utils/constants.ts firestore.rules
git commit -m "feat: add admin notification data model and firestore rules"
```

---

### Task 2: Backend — módulo central `notifyAdmins`

**Files:**
- Create: `functions/notifications.js`

**Interfaces:**
- Consumes: `firebase-admin/firestore` (`getFirestore`, `FieldValue` — ya inicializado por `initializeApp()` en `functions/index.js`, que se ejecuta antes de que cualquier función se invoque), `firebase-admin/messaging` (`getMessaging`).
- Produces: `notifyAdmins({ type, title, body, data? }): Promise<void>`, `cleanupInvalidTokens(adminsSnap, response, tokens): Promise<void>` — usados por Task 3 y Task 4.

- [ ] **Step 1: Crear `functions/notifications.js`**

```js
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const db = getFirestore();
const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";
const USERS_COLLECTION = "users";

const cleanupInvalidTokens = async (adminsSnap, response, tokens) => {
  const invalidTokens = new Set();

  response.responses.forEach((result, index) => {
    if (
      !result.success &&
      result.error?.code === "messaging/registration-token-not-registered"
    ) {
      invalidTokens.add(tokens[index]);
    }
  });

  if (invalidTokens.size === 0) {
    return;
  }

  await Promise.all(
    adminsSnap.docs.map(async (adminDoc) => {
      const adminTokens = adminDoc.data().fcmTokens || [];
      const tokensToRemove = adminTokens.filter((token) =>
        invalidTokens.has(token),
      );

      if (tokensToRemove.length > 0) {
        await adminDoc.ref.update({
          fcmTokens: FieldValue.arrayRemove(...tokensToRemove),
        });
      }
    }),
  );
};

const notifyAdmins = async ({ type, title, body, data = {} }) => {
  await db.collection(ADMIN_NOTIFICATIONS_COLLECTION).add({
    type,
    title,
    body,
    ...data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const adminsSnap = await db
    .collection(USERS_COLLECTION)
    .where("role", "==", "admin")
    .get();

  const tokens = adminsSnap.docs.flatMap((doc) => doc.data().fcmTokens || []);

  if (tokens.length === 0) {
    return;
  }

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    ),
  });

  await cleanupInvalidTokens(adminsSnap, response, tokens);
};

module.exports = { notifyAdmins, cleanupInvalidTokens };
```

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check functions/notifications.js`
Expected: sin salida (sintaxis válida).

- [ ] **Step 3: Verificar manualmente contra el emulador de Firestore**

Abre dos terminales.

Terminal A — arranca el emulador:
```bash
npx firebase-tools emulators:start --only firestore
```
Expected: `✔  firestore: Emulator started at http://localhost:8080`

Terminal B — corre este script (no dejes ningún admin con `fcmTokens` en el emulador todavía, así se prueba la rama sin push, sin depender de FCM real):
```bash
cd functions
FIRESTORE_EMULATOR_HOST=localhost:8080 node -e "
const { initializeApp } = require('firebase-admin/app');
initializeApp({ projectId: 'demo-merakiaca' });
const { notifyAdmins } = require('./notifications');
notifyAdmins({ type: 'sale', title: 'Test', body: 'Test body', data: { orderId: 'abc123' } })
  .then(() => console.log('OK'))
  .catch((err) => { console.error(err); process.exit(1); });
"
```
Expected: imprime `OK`. Luego abre `http://localhost:4000/firestore` (Emulator UI) y confirma que existe un documento en `adminNotifications` con `type: "sale"`, `orderId: "abc123"`, `read: false`.

Detén ambos procesos (Ctrl+C) al terminar.

- [ ] **Step 4: Commit**

```bash
git add functions/notifications.js
git commit -m "feat: add shared notifyAdmins helper for FCM and notification history"
```

---

### Task 3: Backend — triggers de orden nueva y stock bajo

**Files:**
- Create: `functions/triggers.js`
- Modify: `functions/index.js` (re-exportar los triggers)

**Interfaces:**
- Consumes: `notifyAdmins` de `./notifications` (Task 2).
- Produces: `onOrderCreated`, `onProductStockChanged` (Cloud Functions v2, exportadas desde `functions/index.js`).

- [ ] **Step 1: Crear `functions/triggers.js`**

```js
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { notifyAdmins } = require("./notifications");

const LOW_STOCK_THRESHOLD = 3;

const onOrderCreated = onDocumentCreated(
  { region: "us-central1", document: "orders/{orderId}" },
  async (event) => {
    const order = event.data?.data();
    if (!order) {
      return;
    }

    await notifyAdmins({
      type: "new_order",
      title: "Orden nueva (sin pagar)",
      body: `${order.shippingAddress?.fullName || "Cliente"} — $${order.total ?? 0}`,
      data: { orderId: event.params.orderId },
    });
  },
);

const onProductStockChanged = onDocumentUpdated(
  { region: "us-central1", document: "products/{productId}" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) {
      return;
    }

    const beforeFabrics = Array.isArray(before.fabrics) ? before.fabrics : [];
    const afterFabrics = Array.isArray(after.fabrics) ? after.fabrics : [];

    for (const fabric of afterFabrics) {
      const prevFabric = beforeFabrics.find((f) => f.id === fabric.id);
      const crossedThreshold =
        prevFabric &&
        prevFabric.stock > LOW_STOCK_THRESHOLD &&
        fabric.stock <= LOW_STOCK_THRESHOLD;

      if (crossedThreshold) {
        await notifyAdmins({
          type: "low_stock",
          title: "Stock bajo",
          body: `${after.name || "Producto"} — ${fabric.name}: quedan ${fabric.stock}`,
          data: { productId: event.params.productId },
        });
      }
    }
  },
);

module.exports = { onOrderCreated, onProductStockChanged };
```

- [ ] **Step 2: Re-exportar los triggers desde `functions/index.js`**

Agrega esta línea cerca del resto de los `require` al inicio de `functions/index.js` (después de `const cors = require("cors");`):

```js
const { onOrderCreated, onProductStockChanged } = require("./triggers");

exports.onOrderCreated = onOrderCreated;
exports.onProductStockChanged = onProductStockChanged;
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check functions/triggers.js && node --check functions/index.js`
Expected: sin salida.

- [ ] **Step 4: Verificar manualmente contra el emulador (Firestore + Functions)**

Terminal A:
```bash
npx firebase-tools emulators:start --only firestore,functions
```
Expected: ambos emuladores arrancan y el log de Functions muestra `onOrderCreated` y `onProductStockChanged` cargadas.

Abre `http://localhost:4000/firestore` (Emulator UI):

1. **Orden nueva:** crea manualmente un documento en la colección `orders` con estos campos: `total: 500`, `shippingAddress: { fullName: "Cliente Test" }` (mapa anidado), `paymentStatus: "pending"`. Espera unos segundos y confirma que aparece un documento nuevo en `adminNotifications` con `type: "new_order"` y `body` conteniendo `"Cliente Test"`.

2. **Stock bajo (cruce de umbral):** crea un documento en `products` con `name: "Cojín Test"`, `fabrics: [{ id: "f1", name: "Lino", stock: 5 }]`. Luego edítalo y cambia `stock` de `f1` a `2`. Confirma que aparece un documento en `adminNotifications` con `type: "low_stock"` y `body` conteniendo `"quedan 2"`.

3. **No-duplicado:** edita el mismo producto de nuevo, bajando `stock` de `2` a `1` (sigue ≤3, no cruza el umbral otra vez). Confirma que **no** aparece una segunda notificación de `low_stock` para ese producto.

Detén los emuladores (Ctrl+C) al terminar.

- [ ] **Step 5: Commit**

```bash
git add functions/triggers.js functions/index.js
git commit -m "feat: notify admins on new pending orders and low fabric stock"
```

---

### Task 4: Backend — enganchar venta aprobada y pago rechazado

**Files:**
- Modify: `functions/index.js:1-19` (agregar `require`)
- Modify: `functions/index.js:99-173` (función `applyOrderPaymentUpdate`)

**Interfaces:**
- Consumes: `notifyAdmins` de `./notifications` (Task 2).
- Produces: `exports.applyOrderPaymentUpdate` (agregado solo para poder verificarla de forma aislada; sigue siendo usada internamente por `mpWebhook` y `mpSyncPaymentStatus` sin cambios en su firma ni comportamiento previo).

- [ ] **Step 1: Importar `notifyAdmins`**

En `functions/index.js`, junto al `require` agregado en el Task 3, agrega también:

```js
const { notifyAdmins } = require("./notifications");
```

- [ ] **Step 2: Reemplazar la función `applyOrderPaymentUpdate`**

Reemplaza el bloque completo de `functions/index.js` líneas 99-173 (desde `const applyOrderPaymentUpdate = async ({` hasta el `};` que cierra la función, justo antes de `const fetchMercadoPagoPayment`) por:

```js
const applyOrderPaymentUpdate = async ({
  orderId,
  mercadoPagoPaymentId,
  mercadoPagoStatus,
  note,
}) => {
  const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
  let shouldReduceStock = false;
  let orderItems = [];
  const paymentStatus = mapMercadoPagoStatus(mercadoPagoStatus);
  let paymentStatusChanged = false;
  let orderForNotification = null;

  await db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists) {
      throw new Error("La orden no existe.");
    }

    const order = orderSnapshot.data();
    const now = Timestamp.now();
    const updateData = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      mercadoPagoPaymentId &&
      order.mercadoPagoPaymentId !== mercadoPagoPaymentId
    ) {
      updateData.mercadoPagoPaymentId = mercadoPagoPaymentId;
    }

    if (order.paymentStatus !== paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData.paymentStatusHistory = FieldValue.arrayUnion({
        paymentStatus,
        changedAt: now,
        changedBy: "mercadopago-webhook",
        note: note || null,
      });
      paymentStatusChanged = true;
      orderForNotification = order;
    }

    if (paymentStatus === "approved" && !order.paymentApprovedAt) {
      updateData.paymentApprovedAt = now;

      if (order.status !== "processing") {
        updateData.status = "processing";
        updateData.statusHistory = FieldValue.arrayUnion({
          status: "processing",
          changedAt: now,
          changedBy: "mercadopago-webhook",
          note: "Estado actualizado automáticamente al aprobar el pago",
        });
      }

      shouldReduceStock = true;
      orderItems = Array.isArray(order.items) ? order.items : [];
    }

    if (Object.keys(updateData).length > 1) {
      transaction.update(orderRef, updateData);
    }
  });

  if (shouldReduceStock) {
    for (const item of orderItems) {
      await reduceProductFabricStock(
        item.productId,
        item.fabricId,
        item.quantity,
      );
    }
  }

  if (paymentStatusChanged && orderForNotification) {
    const customerName =
      orderForNotification.shippingAddress?.fullName || "Cliente";

    if (paymentStatus === "approved") {
      await notifyAdmins({
        type: "sale",
        title: "Nueva venta \u{1F389}",
        body: `$${toSafeNumber(orderForNotification.total, 0)} — ${customerName}`,
        data: { orderId },
      });
    } else if (paymentStatus === "rejected") {
      await notifyAdmins({
        type: "payment_rejected",
        title: "Pago rechazado",
        body: `Orden de ${customerName} — pago rechazado`,
        data: { orderId },
      });
    }
  }

  return { paymentStatus, stockReduced: shouldReduceStock };
};
```

Nota: `toSafeNumber` ya está definida más abajo en el mismo archivo (línea 235 original) pero se usa aquí arriba — en JavaScript esto funciona porque `const` con función flecha se resuelve en tiempo de ejecución, no de parseo, y para cuando `applyOrderPaymentUpdate` se invoca (siempre desde dentro de un handler `onRequest`), todo el módulo ya se cargó por completo. No requiere mover nada de orden.

- [ ] **Step 3: Exportar `applyOrderPaymentUpdate` para poder probarla de forma aislada**

Agrega esta línea junto a los demás `exports.*` al final de `functions/index.js` (después de `exports.mpWebhook = ...`):

```js
exports.applyOrderPaymentUpdate = applyOrderPaymentUpdate;
```

- [ ] **Step 4: Verificar sintaxis**

Run: `node --check functions/index.js`
Expected: sin salida.

- [ ] **Step 5: Verificar manualmente contra el emulador de Firestore**

Terminal A:
```bash
npx firebase-tools emulators:start --only firestore
```

Terminal B — seedea una orden pendiente y luego aplica el cambio de pago:
```bash
cd functions
FIRESTORE_EMULATOR_HOST=localhost:8080 node -e "
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'demo-merakiaca' });
const db = getFirestore();

(async () => {
  await db.collection('orders').doc('order-test-1').set({
    userId: 'user1',
    items: [],
    total: 750,
    status: 'pending',
    paymentStatus: 'pending',
    shippingAddress: { fullName: 'Cliente Prueba' },
  });

  const { applyOrderPaymentUpdate } = require('./index.js');
  const result = await applyOrderPaymentUpdate({
    orderId: 'order-test-1',
    mercadoPagoPaymentId: 'pay-1',
    mercadoPagoStatus: 'approved',
  });
  console.log('result:', result);
})().catch((err) => { console.error(err); process.exit(1); });
"
```
Expected: imprime `result: { paymentStatus: 'approved', stockReduced: false }` sin error. Luego, en `http://localhost:4000/firestore`, confirma que existe un documento nuevo en `adminNotifications` con `type: "sale"` y `body` conteniendo `"Cliente Prueba"`.

Repite el mismo script cambiando `mercadoPagoStatus: 'rejected'` y `orderId: 'order-test-2'` (con su propio seed) para confirmar que se genera un documento `type: "payment_rejected"`.

Detén el emulador (Ctrl+C) al terminar.

- [ ] **Step 6: Commit**

```bash
git add functions/index.js
git commit -m "feat: notify admins when a payment is approved or rejected"
```

---

### Task 5: Frontend — registro de push (service worker, manifest, servicio)

**Files:**
- Create: `public/firebase-messaging-sw.js`
- Create: `public/manifest.json`
- Create: `src/services/notifications.service.ts`
- Modify: `index.html`
- Modify: `.env.production`
- Modify: `.env.example`

**Interfaces:**
- Produces: `requestNotificationPermission(userId: string): Promise<boolean>`, `onForegroundMessage(callback: (title: string, body: string) => void): Promise<() => void>` — usados por Task 6.

- [ ] **Step 1: Crear el service worker de FCM**

Crea `public/firebase-messaging-sw.js` (no puede usar `import.meta.env` — los service workers estáticos en `public/` no pasan por Vite, así que la config va literal; estos valores ya son públicos, están en el bundle del cliente):

```js
importScripts(
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAX12tiTOkSoJ6HWrm4r6qXTNedmjRFy7A",
  authDomain: "merakiaca-3a05a.firebaseapp.com",
  projectId: "merakiaca-3a05a",
  storageBucket: "merakiaca-3a05a.firebasestorage.app",
  messagingSenderId: "892600849294",
  appId: "1:892600849294:web:84f33fb4cb41ea62a70adf",
});

firebase.messaging();
```

- [ ] **Step 2: Crear el manifest mínimo**

Crea `public/manifest.json`:

```json
{
  "name": "Merakiaca - Panel Admin",
  "short_name": "Merakiaca",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2391C3",
  "icons": [
    { "src": "/logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Enlazar el manifest en `index.html`**

En `index.html`, agrega estas dos líneas después de `<link rel="apple-touch-icon" href="/logo.png" />` (línea 6):

```html
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2391C3" />
```

- [ ] **Step 4: Agregar la variable de entorno del VAPID key**

En `.env.production`, agrega al final del bloque `# Firebase Config - Producción`:

```
VITE_FIREBASE_VAPID_KEY=
```

En `.env.example`, agrega la misma línea con un comentario:

```
# Generar en Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
VITE_FIREBASE_VAPID_KEY=
```

**Nota manual (no es un paso de código):** antes de poder probar el push real, hay que generar el VAPID key en Firebase Console → Configuración del proyecto → Cloud Messaging → pestaña "Web Push certificates" → "Generate key pair", y pegar el valor en `.env.production` (y en `.env.local` para desarrollo local, sin commitear ese archivo).

- [ ] **Step 5: Crear `src/services/notifications.service.ts`**

```ts
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
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores.

- [ ] **Step 7: Verificar lint**

Run: `npx eslint src/services/notifications.service.ts`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add public/firebase-messaging-sw.js public/manifest.json index.html .env.production .env.example src/services/notifications.service.ts
git commit -m "feat: add FCM web push registration and minimal PWA manifest"
```

---

### Task 6: Frontend — campanita de notificaciones en el Header

**Files:**
- Create: `src/components/admin/NotificationBell.tsx`
- Modify: `src/components/layout/Header.tsx:98-106` (desktop nav)
- Modify: `src/components/layout/Header.tsx:203-212` (mobile nav)

**Interfaces:**
- Consumes: `AdminNotification` (Task 1), `requestNotificationPermission`, `onForegroundMessage` (Task 5), `FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS` (Task 1), `ROUTES.ADMIN` (existente en `src/utils/constants.ts`).

- [ ] **Step 1: Crear `src/components/admin/NotificationBell.tsx`**

```tsx
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

    onForegroundMessage((title, body) => {
      toast(`${title}: ${body}`);
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    return () => {
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
```

- [ ] **Step 2: Montar la campanita en el nav de escritorio**

En `src/components/layout/Header.tsx`, agrega el import junto a los demás (después de `import logo from "@/assets/logo.png";`):

```tsx
import NotificationBell from "@/components/admin/NotificationBell";
```

Reemplaza el bloque de las líneas 98-106:

```tsx
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="bg-[#8A4A86] hover:bg-[#6A3A66] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <UserCog className="h-5 w-5" />
                    Admin
                  </Link>
                )}
```

por:

```tsx
                {user.role === "admin" && (
                  <>
                    <NotificationBell />
                    <Link
                      to="/admin"
                      className="bg-[#8A4A86] hover:bg-[#6A3A66] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <UserCog className="h-5 w-5" />
                      Admin
                    </Link>
                  </>
                )}
```

- [ ] **Step 3: Montar la campanita en el menú móvil**

Reemplaza el bloque de las líneas 203-212 (ahora desplazadas unas líneas por el Step 2, ubícalo por contenido):

```tsx
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-[#8A4A86] hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800 font-semibold transition-colors flex items-center gap-2"
                  >
                    <UserCog className="h-5 w-5" />
                    Admin
                  </Link>
                )}
```

por:

```tsx
                {user.role === "admin" && (
                  <>
                    <div className="px-4 py-2">
                      <NotificationBell />
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-[#8A4A86] hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800 font-semibold transition-colors flex items-center gap-2"
                    >
                      <UserCog className="h-5 w-5" />
                      Admin
                    </Link>
                  </>
                )}
```

- [ ] **Step 4: Verificar tipos y lint**

Run: `npx tsc -b && npx eslint src/components/admin/NotificationBell.tsx src/components/layout/Header.tsx`
Expected: sin errores.

- [ ] **Step 5: Verificar en el navegador**

Run: `npm run dev`

1. Entra a `http://localhost:5173/login` e inicia sesión con una de las cuentas de `VITE_ADMIN_EMAILS` (`samugutibarona@gmail.com` o `merakiaca.c@gmail.com`).
2. Confirma que la campanita aparece junto al botón "Admin" en el header (desktop) y en el menú hamburguesa (mobile, ancho de ventana angosto).
3. Click en la campanita → confirma que abre el dropdown con "Activar notificaciones" (si el navegador nunca pidió permiso) y "Sin notificaciones".
4. Click en "Activar notificaciones" → el navegador debe mostrar el prompt nativo de permiso de notificaciones (Chrome/Edge en `localhost` lo soporta sin HTTPS real).
5. En otra pestaña, abre la consola de Firebase (o el emulador si lo tienes corriendo) y agrega manualmente un documento a `adminNotifications` con `type: "sale"`, `title: "Prueba"`, `body: "Notificación de prueba"`, `read: false`, `createdAt: <ahora>`. Confirma que aparece en la campanita en tiempo real sin recargar la página, y que el badge de no leídos se actualiza.
6. Click en esa notificación → confirma que navega a `/admin/ordenes` y que el badge baja en 1.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/NotificationBell.tsx src/components/layout/Header.tsx
git commit -m "feat: add admin notification bell with realtime history"
```

---

## Después de completar los 6 tasks

Pasos manuales que le corresponden al usuario (no se ejecutan como parte de este plan):

1. Generar el VAPID key en Firebase Console (ver nota en Task 5, Step 4) y agregarlo a `.env.production` / `.env.local`.
2. `firebase deploy --only firestore:rules` — publica las reglas nuevas de `adminNotifications`.
3. `npm run deploy:functions` — publica `onOrderCreated`, `onProductStockChanged`, y la versión actualizada de `mpWebhook`/`mpSyncPaymentStatus`.
4. `npm run deploy:preview` (o `npm run deploy`) — publica el frontend con el service worker y el manifest nuevos.
5. Probar el flujo real: entrar al panel admin en el celular, activar notificaciones, y hacer una compra de prueba en sandbox de Mercado Pago para confirmar que el push llega.
