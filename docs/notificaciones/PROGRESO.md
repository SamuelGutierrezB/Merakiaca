# Notificaciones Push al Admin — Progreso

> Spec: [`../superpowers/specs/2026-08-24-notificaciones-admin-design.md`](../superpowers/specs/2026-08-24-notificaciones-admin-design.md)
> Plan: [`../superpowers/plans/2026-08-24-notificaciones-admin-plan.md`](../superpowers/plans/2026-08-24-notificaciones-admin-plan.md)
> Ledger: `.claude/worktrees/notificaciones-admin/.superpowers/sdd/2026-08-24-notificaciones-admin-plan/progress.md`
> PR: https://github.com/SamuelGutierrezB/Merakiaca/pull/1

## Estado: desplegado en producción, pendiente de PR sin mergear y prueba real en celular

Las 6 tareas del plan están implementadas, con review limpio, y ya **desplegadas en producción** (Firestore rules, Cloud Functions y hosting). El código vive en la rama `worktree-notificaciones-admin` (PR #1 abierto contra `main`, sin mergear todavía).

## Qué se hizo (6/6 tareas + 1 fix post-review)

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

**Diff total:** 17 archivos, +~500/−34 líneas.

## Despliegue a producción (hecho hoy)

- ✅ `firebase deploy --only firestore:rules` — reglas de `adminNotifications` publicadas.
- ✅ Cloud Functions desplegadas **por nombre** (no con `--only functions` a secas): `onOrderCreated`, `onProductStockChanged` (nuevas), `mpCreatePreference`, `mpSyncPaymentStatus`, `mpWebhook` (actualizadas). Los dos triggers nuevos fallaron en el primer intento por permisos de Eventarc no propagados todavía (mensaje esperado la primera vez que un proyecto usa Cloud Functions 2nd gen con triggers de evento) — se resolvió solo esperando ~90s y reintentando.
- ✅ `npm run build:prod && firebase deploy --only hosting` — service worker (`firebase-messaging-sw.js`) y manifest publicados en `https://merakiaca-3a05a.web.app`.

**Nota importante para futuros deploys de functions:** este proyecto tiene funciones (`applyDiscountCode`, `validateDiscountCode`) que están **vivas en producción** pero pertenecen a la rama `feature/discount-code`, no mergeada a `main`. Un `firebase deploy --only functions` sin acotar por nombre, corrido desde una rama que no incluya esas funciones, las marca para **borrado**. Siempre desplegar Functions listando los nombres explícitos hasta que esa rama se mergee o se decida su destino.

## Pendiente

- [ ] **Mergear el PR #1** a `main` (o decidir si se deja abierto más tiempo).
- [ ] **Prueba end-to-end real:** activar notificaciones desde el celular del admin (`https://merakiaca-3a05a.web.app`, cuentas de `VITE_ADMIN_EMAILS`) y hacer una compra de prueba en sandbox de Mercado Pago para confirmar que el push llega. Esto no se puede automatizar — requiere un dispositivo físico y aceptar el permiso de notificaciones.
- [ ] Opcional / no bloqueante: `firebase-functions` está en una versión que Firebase marca como desactualizada (warning en cada deploy, sugiere `npm install --save firebase-functions@latest` dentro de `functions/`). No se tocó porque no era parte del alcance del plan y el mensaje avisa de breaking changes.

## Siguiente paso sugerido

Probar en el celular hoy mismo mientras el deploy está fresco. Si el push llega, mergear el PR #1.
