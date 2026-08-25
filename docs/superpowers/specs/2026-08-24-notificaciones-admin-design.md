# Notificaciones push al admin — Diseño

Fecha: 2026-08-24

## Objetivo

Que el admin de Merakiaca reciba una notificación push en el teléfono cuando:

1. Se aprueba una venta (pago aprobado por Mercado Pago).
2. Se rechaza/falla un pago.
3. Se crea una orden nueva (checkout completado, aún sin pagar).
4. El stock de una tela/variante de producto llega a ≤3 unidades.

Además, un historial de estas notificaciones dentro del panel admin (campanita), como respaldo si el push no llega o el permiso no está activo.

## Decisión de canal: Firebase Cloud Messaging (Web Push)

Se usa FCM en vez de WhatsApp Business API o Telegram porque el proyecto ya corre sobre Firebase (Auth, Firestore, Functions) — no se suma proveedor externo, no hay costo por mensaje ni verificación de negocio.

No se construye una PWA completa con offline/caching (fuera de alcance). Solo lo mínimo para recibir push:

- `public/manifest.json` mínimo (name, icons, `start_url`, `display: standalone`) para que en iPhone se pueda "Agregar a inicio" — **requisito de Apple** para recibir push en iOS ≥16.4. En Android/desktop no hace falta instalar nada.
- `public/firebase-messaging-sw.js` — service worker de FCM (scripts compat vía `importScripts`, no pasa por el bundle de Vite).
- VAPID key generada en Firebase Console → Cloud Messaging → Web Push certificates, guardada como `VITE_FIREBASE_VAPID_KEY`.

## Modelo de datos (Firestore)

```ts
// users/{uid} — campo nuevo
fcmTokens?: string[]  // un token por dispositivo/navegador donde el admin activó push

// colección nueva: adminNotifications/{id}
{
  type: "sale" | "payment_rejected" | "new_order" | "low_stock",
  title: string,
  body: string,
  orderId?: string,
  productId?: string,
  read: boolean,
  createdAt: Timestamp,
}
```

**Reglas de Firestore (`firestore.rules`):**

- `adminNotifications`: solo Functions (Admin SDK) puede crear (bypassa reglas). Del lado cliente: `read`/`update` (marcar leído) permitido solo a `isAdmin() || isAdminEmail()`. `create`/`delete` de clientes quedan denegados por la regla default.
- `users/{userId}`: no requiere cambios — `allow update: if isOwner(userId)` ya cubre que el propio admin escriba su `fcmTokens`.

## Backend (Cloud Functions)

Nuevo módulo `functions/notifications.js` con una función compartida:

```js
async function notifyAdmins({ type, title, body, data }) {
  // 1. Guarda el evento en adminNotifications (para la campanita)
  await db.collection("adminNotifications").add({
    type, title, body, ...data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 2. Junta los fcmTokens de todos los usuarios con role: "admin"
  const adminsSnap = await db.collection("users").where("role", "==", "admin").get();
  const tokens = adminsSnap.docs.flatMap((d) => d.data().fcmTokens || []);
  if (tokens.length === 0) return;

  // 3. Envía el push y limpia tokens inválidos que hayan fallado
  const response = await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
  await cleanupInvalidTokens(adminsSnap, response, tokens);
}
```

`cleanupInvalidTokens` recorre `response.responses`, y para cada error `messaging/registration-token-not-registered` quita ese token del array `fcmTokens` del admin dueño (`arrayRemove`).

### Enganches por evento

**1. Venta aprobada / pago rechazado** — dentro de `applyOrderPaymentUpdate` (ya existe en `functions/index.js`, la llaman `mpWebhook` y `mpSyncPaymentStatus`). Ya tiene el chequeo `if (order.paymentStatus !== paymentStatus)`. Justo después de que `runTransaction` resuelve:

- si el nuevo `paymentStatus` es `"approved"` → `notifyAdmins({ type: "sale", title: "Nueva venta 🎉", body: "$${order.total} — ${order.shippingAddress.fullName}", data: { orderId } })`.
- si es `"rejected"` → `notifyAdmins({ type: "payment_rejected", title: "Pago rechazado", body: "..." , data: { orderId } })`.

No cambia la lógica de la transacción existente, solo se agrega la llamada después.

**2. Orden nueva (pending)** — trigger nuevo de Firestore, se dispara cuando el cliente crea el doc `orders` desde el checkout (no pasa por ninguna Function HTTP):

```js
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data.data();
  await notifyAdmins({
    type: "new_order",
    title: "Orden nueva (sin pagar)",
    body: `${order.shippingAddress.fullName} — $${order.total}`,
    data: { orderId: event.params.orderId },
  });
});
```

**3. Stock bajo** — trigger nuevo en `products`, compara `fabrics[]` antes/después y dispara solo en el *cruce* de umbral (de >3 a ≤3), no en cada write mientras siga bajo:

```js
exports.onProductStockChanged = onDocumentUpdated("products/{productId}", async (event) => {
  const before = event.data.before.data().fabrics || [];
  const after = event.data.after.data().fabrics || [];
  for (const fabric of after) {
    const prev = before.find((f) => f.id === fabric.id);
    if (prev && prev.stock > 3 && fabric.stock <= 3) {
      await notifyAdmins({
        type: "low_stock",
        title: "Stock bajo",
        body: `${event.data.after.data().name} — ${fabric.name}: quedan ${fabric.stock}`,
        data: { productId: event.params.productId },
      });
    }
  }
});
```

## Frontend

**`src/services/notifications.service.ts` (nuevo):**

- `requestNotificationPermission()`: pide permiso del navegador, obtiene token con `getToken(messaging, { vapidKey })`, lo guarda en `users/{uid}.fcmTokens` con `arrayUnion` (soporta el mismo admin con panel abierto en compu y celular).
- `onForegroundMessage(callback)`: listener `onMessage` de FCM para cuando el panel está abierto en primer plano — se muestra como toast con `react-hot-toast` (ya está en el proyecto) en vez de notificación nativa del sistema.

**`src/components/admin/NotificationBell.tsx` (nuevo):**

- Se monta en `Header.tsx` junto al link admin existente, solo si `user.role === "admin"`.
- Componente autocontenido: se suscribe con `onSnapshot` a `adminNotifications` (últimos 20, `orderBy("createdAt", "desc")`).
- Badge con conteo de `read: false`; dropdown con la lista. Click en un item marca `read: true` y navega a `/admin/ordenes/:id` o `/admin/productos/editar/:id` según `type`.
- Si el admin no ha dado permiso de notificaciones todavía, la campanita muestra un botón "Activar notificaciones" en vez de pedirlo automáticamente al cargar (pedirlo sin acción del usuario suele terminar bloqueado por el navegador de forma permanente).

## Edge cases

- Multi-dispositivo: cubierto por el array `fcmTokens` + `arrayUnion`/`arrayRemove`.
- Token inválido/expirado: se limpia automáticamente en `notifyAdmins` vía `cleanupInvalidTokens`.
- Sin soporte de push (Safari viejo, o iPhone sin "Agregar a inicio"): degrada con gracia — la campanita y el historial en Firestore siguen funcionando, solo no llega el push nativo.
- No hay notificaciones duplicadas: los triggers comparan estado anterior vs nuevo (ya usado en pagos) o cruce de umbral (stock), nunca en cada write.

## Testing

No hay test runner configurado en el repo (no se agregan tests automatizados). Verificación manual:

- Firebase emulators (`firebase emulators:start`) simulando: creación de orden, cambio de `paymentStatus` a `approved`/`rejected`, baja de stock de una tela a ≤3.
- Prueba real de push end-to-end en un deploy de preview (`npm run deploy:preview`), porque el permiso de notificaciones del navegador necesita HTTPS real fuera de `localhost`.

## Fuera de alcance (v1)

- PWA instalable completa con offline/caching.
- Notificaciones al cliente (cambios de estado de su propia orden) — ya está anotado por separado en `MEJORAS.md`.
- WhatsApp/Telegram como canal alterno.
