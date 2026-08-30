# Notificaciones Push al Admin (Fase 1) — Progreso

> Spec: [`../superpowers/specs/2026-08-24-notificaciones-admin-design.md`](../superpowers/specs/2026-08-24-notificaciones-admin-design.md)
> Plan: [`../superpowers/plans/2026-08-24-notificaciones-admin-plan.md`](../superpowers/plans/2026-08-24-notificaciones-admin-plan.md)
> PR: https://github.com/SamuelGutierrezB/Merakiaca/pull/1 (mergeado)
> Siguiente fase: [`PENDIENTES-FASE-2.md`](./PENDIENTES-FASE-2.md)

## Estado: completo, mergeado y en producción ✅

Las 6 tareas del plan original están implementadas, con review limpio, mergeadas a `main` (commit `127b13a`) y **confirmadas funcionando en producción** — el admin recibió y vio correctamente el push, incluyendo el ícono personalizado.

## Qué se hizo (6/6 tareas + 3 fixes post-review)

| Tarea | Contenido | Commits |
|---|---|---|
| 1 | Modelo de datos: `AdminNotification`, `fcmTokens` en `User`, `FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS`, reglas de Firestore | `b0893d9` |
| 2 | Backend: `functions/notifications.js` — `notifyAdmins()` compartido (escribe historial + manda push, limpia tokens inválidos) | `72aac01` |
| 3 | Backend: `functions/triggers.js` — `onOrderCreated`, `onProductStockChanged` (cruce de umbral ≤3, no repite en cada write) | `7b82fdb` |
| 4 | Backend: engancha `applyOrderPaymentUpdate` para notificar venta aprobada / pago rechazado | `d14c057` |
| 5 | Frontend: `public/firebase-messaging-sw.js`, `public/manifest.json`, `src/services/notifications.service.ts` (`requestNotificationPermission`, `onForegroundMessage`) | `35586c2`, `639e51d` (fix registro FCM) |
| 6 | Frontend: `src/components/admin/NotificationBell.tsx` montado en `Header.tsx` (desktop + mobile), historial en tiempo real | `14b9820`, `39363fa` (fix leak de listener) |
| — | Fix post-review: `notifyAdmins()` envuelto en try/catch dentro de `applyOrderPaymentUpdate` para que un fallo de notificación no le devuelva un 500 al webhook de Mercado Pago | `1991def` |
| — | VAPID key de producción cargada en `.env` / `.env.production` | `432dbe4` |
| — | Ícono personalizado (`/logo.png`) en el payload `webpush.notification.icon` en vez del ícono genérico del navegador | `75343c5` |

**Diff total:** 18 archivos, ~+500/−34 líneas.

## Despliegue a producción

- ✅ `firebase deploy --only firestore:rules` — reglas de `adminNotifications` publicadas.
- ✅ Cloud Functions desplegadas **por nombre**: `onOrderCreated`, `onProductStockChanged` (nuevas), `mpCreatePreference`, `mpSyncPaymentStatus`, `mpWebhook` (actualizadas).
- ✅ `npm run build:prod && firebase deploy --only hosting` — service worker y manifest publicados en `https://merakiaca-3a05a.web.app`.
- ✅ Redeploy de `onOrderCreated`, `onProductStockChanged`, `mpWebhook`, `mpSyncPaymentStatus` tras agregar el ícono personalizado.

**Nota importante para futuros deploys de functions en este proyecto:** existen funciones (`applyDiscountCode`, `validateDiscountCode`) vivas en producción que pertenecen a la rama `feature/discount-code`, no mergeada a `main`. Un `firebase deploy --only functions` sin acotar por nombre, corrido desde una rama que no incluya esas funciones, las marca para **borrado**. Siempre desplegar Functions listando los nombres explícitos hasta que esa rama se mergee o se decida su destino.

## Pendiente (menor, no bloqueante)

- [ ] `firebase-functions` está en una versión que Firebase marca como desactualizada (warning en cada deploy, sugiere `npm install --save firebase-functions@latest` dentro de `functions/`). No se tocó porque no era parte del alcance del plan y el mensaje avisa de breaking changes.

## Cierre

Confirmado por el usuario: las notificaciones llegan bien y el ícono se ve correcto. PR #1 mergeado a `main`, rama remota borrada. Fase 1 (notificaciones al admin) cerrada — el trabajo que sigue (notificaciones a clientes + mejoras a la campanita + fix de botón de reintento de pago) vive en [`PENDIENTES-FASE-2.md`](./PENDIENTES-FASE-2.md).
