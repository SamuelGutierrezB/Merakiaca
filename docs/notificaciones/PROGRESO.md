# Notificaciones Push al Admin — Progreso

> Spec: [`../superpowers/specs/2026-08-24-notificaciones-admin-design.md`](../superpowers/specs/2026-08-24-notificaciones-admin-design.md)
> Plan: [`../superpowers/plans/2026-08-24-notificaciones-admin-plan.md`](../superpowers/plans/2026-08-24-notificaciones-admin-plan.md)
> Ledger: `.claude/worktrees/notificaciones-admin/.superpowers/sdd/2026-08-24-notificaciones-admin-plan/progress.md`

## Estado: código completo, sin desplegar ni mergear

Las 6 tareas del plan están implementadas y con review limpio, pero **viven en un git worktree aparte** (`.claude/worktrees/notificaciones-admin`, branch `worktree-notificaciones-admin`) que todavía no se mergeó a `main` ni se subió a `origin`. `main` solo tiene los dos commits de documentación (spec + plan).

## Qué se hizo (6/6 tareas)

| Tarea | Contenido | Commits |
|---|---|---|
| 1 | Modelo de datos: `AdminNotification`, `fcmTokens` en `User`, `FIREBASE_COLLECTIONS.ADMIN_NOTIFICATIONS`, reglas de Firestore | `b0893d9` |
| 2 | Backend: `functions/notifications.js` — `notifyAdmins()` compartido (escribe historial + manda push, limpia tokens inválidos) | `72aac01` |
| 3 | Backend: `functions/triggers.js` — `onOrderCreated`, `onProductStockChanged` (cruce de umbral ≤3, no repite en cada write) | `7b82fdb` |
| 4 | Backend: engancha `applyOrderPaymentUpdate` para notificar venta aprobada / pago rechazado | `d14c057` |
| 5 | Frontend: `public/firebase-messaging-sw.js`, `public/manifest.json`, `src/services/notifications.service.ts` (`requestNotificationPermission`, `onForegroundMessage`) | `35586c2`, `639e51d` (fix registro FCM) |
| 6 | Frontend: `src/components/admin/NotificationBell.tsx` montado en `Header.tsx` (desktop + mobile), historial en tiempo real | `14b9820`, `39363fa` (fix leak de listener) |

**Diff total:** 16 archivos, +484/−20 líneas.

## Pendiente conocido

1. **Nota técnica sin resolver (Task 4, marcada "deferred" en el review):** en `functions/index.js` (~líneas 182-201), `notifyAdmins()` se llama sin try/catch dentro de `applyOrderPaymentUpdate`. Si `notifyAdmins` lanza un error, el webhook de Mercado Pago puede recibir un 500 aunque la orden ya se haya procesado correctamente (reintento de MP es seguro por ser idempotente, pero genera ruido/alertas falsas). No bloqueante, pero vale la pena envolverlo en un try/catch que solo loguee.

## Qué falta para que funcione en producción

Ninguno de estos pasos se ejecutó todavía (son manuales, a propósito — el plan no los automatiza):

- [ ] **Mergear/pushear la rama.** El trabajo está solo en el worktree local, no en `origin`. Decidir: PR normal o merge directo a `main`.
- [ ] **Generar el VAPID key** en Firebase Console → Project Settings → Cloud Messaging → Web Push certificates, y pegarlo en `.env.production` y `.env.local` (`VITE_FIREBASE_VAPID_KEY=` está vacío en ambos).
- [ ] **Desplegar reglas de Firestore:** `firebase deploy --only firestore:rules`.
- [ ] **Desplegar Cloud Functions:** `npm run deploy:functions` (publica `onOrderCreated`, `onProductStockChanged` y la versión actualizada de `mpWebhook`/`mpSyncPaymentStatus`).
- [ ] **Desplegar frontend:** `npm run deploy:preview` o `npm run deploy` (publica el service worker y el manifest nuevos).
- [ ] **Prueba end-to-end real:** activar notificaciones desde el celular del admin y hacer una compra de prueba en sandbox de Mercado Pago para confirmar que el push llega.

## Siguiente paso sugerido

Cuando quieras avanzar, lo natural es cerrar el worktree con `superpowers:finishing-a-development-branch` (mergear/PR) y después correr la lista de despliegue de arriba en orden.
