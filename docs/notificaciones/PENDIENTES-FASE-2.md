# Fase 2 — Notificaciones a clientes, mejoras a la campanita, y fix de reintento de pago

> Fase 1 (notificaciones al admin): [`PROGRESO.md`](./PROGRESO.md) — completa y en producción.
> Este documento es la lista de trabajo pendiente que salió de la conversación del 2026-08-30. Todavía no tiene plan técnico paso a paso — es el punto de partida para brainstormear/planear cada bloque antes de implementar.

## 1. Notificaciones push para clientes

**Objetivo:** que el cliente reciba push sobre el estado de su propio pedido (no solo el admin).

- [ ] Al terminar la compra (pantalla de éxito en `OrderResult.tsx`), mostrar un aviso propio de la app preguntando si quiere recibir notificaciones (no el prompt nativo del navegador de una — primero un modal/banner nuestro).
- [ ] Si acepta, ahí sí disparar el permiso nativo del navegador y registrar su token FCM. El helper `requestNotificationPermission(userId)` en `src/services/notifications.service.ts` ya es genérico (no es admin-only, escribe en `users/{userId}.fcmTokens`) — se puede reusar tal cual, sin tocarlo.
- [ ] Backend: decidir el mecanismo para notificar al cliente dueño de una orden específica (no a todos los admins). Hoy `notifyAdmins()` siempre manda a *todos* los usuarios con `role: "admin"` — se necesita algo nuevo tipo `notifyCustomer(userId, {...})` que mande solo a los tokens de ese usuario.
- [ ] Decidir qué eventos disparan push al cliente: ¿solo pago aprobado/rechazado de su propia orden? ¿también cambios de `status` (procesando, enviado, entregado)? Enganchar en `applyOrderPaymentUpdate` y/o donde se actualice `order.status`.

**Preguntas abiertas (para decidir antes de planear el código):**
- ¿El cliente necesita una campanita con historial (como el admin), o solo push sin UI de historial dentro de la app?
- ¿Dónde vive el "aviso propio" del opt-in — modal, banner, toast? ¿Se vuelve a preguntar si dice que no, o se respeta la decisión para siempre (como hacen la mayoría de sitios)?

## 2. Mejoras a las notificaciones del admin (`NotificationBell.tsx` + backend)

- [ ] **Notificación de stock agotado (0 unidades), distinta de "stock bajo".** Hoy `functions/triggers.js` (`onProductStockChanged`) solo tiene un tipo `low_stock` que dispara al cruzar de >3 a ≤3 (incluye el 0, pero con el mismo título "Stock bajo — quedan 0"). Falta un tipo nuevo `out_of_stock` que dispare específicamente al cruzar de >0 a ===0, con su propio título ("Se agotó el stock") para que no se confunda con "stock bajo".
- [x] **Notificación de pago rechazado.** Ya existe y está en producción (`type: "payment_rejected"`, implementado en Fase 1, `functions/index.js` dentro de `applyOrderPaymentUpdate`). No requiere trabajo nuevo — solo confirmarlo si hay duda.
- [ ] **Borrar notificaciones.** Hoy `firestore.rules` deniega explícitamente `delete` en `adminNotifications` (solo Cloud Functions puede crear/borrar). Decidir: ¿borrado real (permitir `delete` a admins en las reglas) o solo "ocultar/marcar leída" sin borrar el documento (mantiene el historial como log de auditoría)? Recomendación: borrado real es razonable aquí — no es un dato sensible tipo transacción financiera, es solo una bandeja operativa.
- [ ] **Mostrar la hora de cada notificación.** `NotificationBell.tsx` no imprime `notification.createdAt` en ningún lado. Formatear con `date-fns` (ya es dependencia del proyecto, se usa en otros lados) — algo tipo "hace 5 min" o la hora exacta.

## 3. Bug: falta botón de reintentar pago en "Mis pedidos"

**Investigado y confirmado** (no es que se haya quitado — nunca se agregó ahí):

- El flujo de reintento de pago (commit `1ddcb05`, "Mejora flujo de pago rechazado con reintento") **solo tocó `src/pages/OrderResult.tsx`** — la pantalla que se muestra justo después de que Mercado Pago redirige tras un pago fallido. Usa `createMercadoPagoPreference(orderId)` y redirige a `preference.initPoint`.
- `src/pages/MyOrders.tsx` ("Mis pedidos", la lista persistente de órdenes del cliente) **nunca tuvo ese botón** — solo pinta el badge de `paymentStatus` (línea ~213-219) sin ninguna acción asociada. Si el cliente cierra la pantalla de resultado sin reintentar, no tiene forma de volver a pagar esa orden después.

**Fix a implementar:**
- [ ] En `MyOrders.tsx`, agregar un botón "Reintentar pago" que solo aparezca cuando `order.paymentStatus === "rejected"`, reusando `createMercadoPagoPreference(order.id)` (mismo patrón que `OrderResult.tsx`, importar de `@/services/mercadopago.service`).

## Siguiente paso sugerido

Elegir por cuál empezar. El fix del botón de reintentar pago es el más chico y aislado (un componente, un servicio ya existente) — buen candidato para hacer primero hoy si el tiempo apremia. Las notificaciones a clientes son el bloque más grande (toca backend nuevo + decisiones de producto todavía abiertas arriba).
