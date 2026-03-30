# Integración de Pagos — Mercado Pago

> Última actualización: 29 de marzo de 2026 | **Status: ✅ Cloud Function desplegada y segura**

---

## 1. Estado actual — qué está implementado

### 1.1 Flujo general (seguro, backend-driven)

```
Usuario llena Checkout
        ↓
Se crea la orden en Firestore  (paymentStatus: "pending")
        ↓
Cliente llama Cloud Function callable: createMercadoPagoPreference(orderId)
        ↓
Cloud Function valida que la orden le pertenezca al usuario autenticado
        ↓
Cloud Function recalcula precios desde Firestore (no confía en el cliente)
        ↓
Cloud Function accede al Access Token desde Secret Manager
        ↓
Cloud Function crea preferencia en MP API y guarda preferenceId
        ↓
Browser redirige a init_point de Mercado Pago
        ↓
Usuario paga en la plataforma de MP
        ↓
MP redirige a /orden/success | /orden/failure | /orden/pending
        ↓
OrderResult.tsx actualiza paymentStatus en Firestore
```

**Mejoras de seguridad implementadas:**

- ✅ Access Token **NO** está en el bundle JS del cliente (vive en Secret Manager)
- ✅ Precios se recalculan desde Firestore (previene manipulación)
- ✅ Validación de propiedad de la orden (solo el dueño puede pagar)
- ✅ Autenticación requerida (Firebase Auth tokens en la petición)

### 1.2 Archivos clave

| Archivo                               | Responsabilidad                                                         |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `functions/index.js`                  | **Cloud Function callable** que crea preferencias de MP de forma segura |
| `functions/package.json`              | Dependencias de Firebase Functions                                      |
| `src/services/mercadopago.service.ts` | Cliente que llama la Cloud Function (sin acceso a tokens)               |
| `src/pages/Checkout.tsx`              | Formulario consumidor de la callable                                    |
| `src/pages/OrderResult.tsx`           | Landing de vuelta de MP. Actualiza estado de la orden                   |
| `src/services/firebase.ts`            | Inicializa `functions` para poder llamar callables                      |
| `firebase.json`                       | Configuración que incluye functions                                     |

### 1.3 Variables de entorno (cliente)

Ahora el cliente **NO necesita** `VITE_MERCADOPAGO_ACCESS_TOKEN`. Solo:

| Variable                       | Ubicación                       |
| ------------------------------ | ------------------------------- |
| `VITE_MERCADOPAGO_PUBLIC_KEY`  | `.env.production` (no sensible) |
| `VITE_MERCADOPAGO_SUCCESS_URL` | `.env.production`               |
| `VITE_MERCADOPAGO_FAILURE_URL` | `.env.production`               |
| `VITE_MERCADOPAGO_PENDING_URL` | `.env.production`               |

### 1.4 Secretos de Firebase (backend)

| Secreto                    | Ubicación                  | Estado            |
| -------------------------- | -------------------------- | ----------------- |
| `MERCADOPAGO_ACCESS_TOKEN` | Secret Manager de Firebase | ✅ **Desplegado** |

Acceso: solo Firebase Functions puede leerlo (configurado en IAM)

### 1.5 Cloud Function

- **Nombre:** `createMercadoPagoPreference`
- **Región:** `us-central1`
- **Tipo:** Callable (HTTPS)
- **Autenticación:** Requiere usuario Firebase autenticado
- **URL:** `https://us-central1-merakiaca-3a05a.cloudfunctions.net/createMercadoPagoPreference`

**Validaciones internas:**

1. Usuario debe estar autenticado
2. `orderId` debe ser válido
3. Orden debe existir en Firestore
4. Orden debe pertenecer al usuario actual
5. Preferencia se crea y se guarda el ID en Firestore

### 1.6 Cómo mapea el estado de pago

| Estado MP                  | PaymentStatus en Firestore                              |
| -------------------------- | ------------------------------------------------------- |
| `approved`                 | `approved` → orden pasa a `processing`, se reduce stock |
| `rejected`                 | `rejected`                                              |
| `cancelled`                | `rejected`                                              |
| `pending` / cualquier otro | `pending`                                               |

---

## 2. Lo que falta / pendiente

### 2.1 🔴 CRÍTICO — Webhooks (IPN)

**Problema:** actualmente el estado de la orden se actualiza **solo si el usuario vuelve** a la app después de pagar. Si el usuario cierra la ventana de MP sin regresar, la orden queda en `pending` aunque el pago haya sido aprobado.

**Solución:** configurar las notificaciones IPN/Webhook de MP para que el servidor actualice el estado automáticamente.

**Pasos pendientes:**

1. Crear una **Firebase Cloud Function** con un endpoint HTTP público, por ejemplo:
   ```
   https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpWebhook
   ```
2. En el dashboard de MP → _Tu negocio → Configuración → Notificaciones IPN_ registrar esa URL.
3. La función debe:
   - Validar que la petición viene de MP (header `x-signature` o query param `data.id`).
   - Hacer `GET https://api.mercadopago.com/v1/payments/{id}` para obtener el estado real.
   - Llamar a `updateOrderPaymentStatus` con el resultado.

### 2.2 � IMPORTANTE — Ambiente de pruebas (Sandbox)

Actualmente siempre usa `init_point` (producción). Para testing hay que:

1. Crear otro secreto `MERCADOPAGO_ACCESS_TOKEN_TEST` en Firebase
2. Agregar la lógica en la function para seleccionar según una env var
3. Usar `sandbox_init_point` cuando sea test

### 2.3 🟠 MEJORA — Expiración de preferencias

Actualmente las preferencias no expiran (`expires: false`). Conviene activar expiración para no acumular preferencias abiertas:

```ts
expires: true,
expiration_date_from: new Date().toISOString(),
expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
```

### 2.4 🟠 MEJORA — Reintentar pago de una orden pendiente

Actualmente si el usuario falla el pago termina en `/carrito` sin ningún vínculo a su orden. Se debería:

- Guardar el `orderId` en la sesión antes de redirigir.
- En la pantalla de fallo, ofrecer botón "Reintentar pago" que crea una nueva preferencia para la misma orden (sin crear una orden duplicada).

### 2.5 🟠 MEJORA — Notificación al admin cuando llega un pago

No hay ningún mecanismo para avisar al equipo de Merakiaca cuando se aprueba un pago. Opciones:

- Firebase Cloud Function trigger en `onUpdate` de la colección `orders` que envíe un email o mensaje de WhatsApp/Telegram cuando `paymentStatus` cambia a `approved`.

### 2.6 🟠 MEJORA — Panel admin: detalle de pago MP

En `AdminOrders`, solo se muestra el `mercadoPagoPaymentId`. Sería útil agregar:

- Enlace directo al pago en el panel de MP.
- Visualización del método de pago (tarjeta, OXXO, transferencia, etc.).

### 2.7 🟢 MENOR — Página de resultado sin `external_reference`

Si MP redirige sin los query params (ej. usuario hace refresh en `/orden/success`), la pantalla muestra el mensaje de éxito pero **no actualiza ninguna orden** y no da contexto al usuario. Se puede mejorar detectando el caso y mostrando un mensaje genérico distinto.

---

## 3. Credenciales y secretos

### En `.env.production` (público, OK):
```
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-143aba6d-7920-4259-b862-5082cb03509f
VITE_MERCADOPAGO_SUCCESS_URL=https://merakiaca-3a05a.web.app/orden/success
VITE_MERCADOPAGO_FAILURE_URL=https://merakiaca-3a05a.web.app/orden/failure
VITE_MERCADOPAGO_PENDING_URL=https://merakiaca-3a05a.web.app/orden/pending
```

### En Firebase Secret Manager (privado, ✅ Seguro):
```
MERCADOPAGO_ACCESS_TOKEN = APP_USR-6819053407099765-032923-…
```

**Cambios vs antes:**
- ✅ Access Token **removido** de `.env.production`
- ✅ Access Token ahora en **Firebase Secret Manager**
- ✅ Solo la Cloud Function puede acceder al secreto

### Cliente NO incluye:
- ❌ Access Token
- ❌ Client Secret
- ❌ Credenciales de Admin

---

## 4. Comandos útiles

```bash
# Desplegar solo Cloud Functions
npm run deploy:functions

# Ver logs de la function
firebase functions:log --project merakiaca-3a05a

# Verificar secretos
firebase functions:secrets:list --project merakiaca-3a05a

# Actualizar un secreto
firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN --project merakiaca-3a05a

# Local emulation
firebase emulators:start
```

---

## 5. Flujo de dinero real

- Los pagos aprobados se acreditan en la cuenta de MP de la empresa
- Comisión MP: ~3.49% + IVA para tarjeta (sin comisión cliente)
- OXXO: cliente paga la comisión, 0% para empresa
- Transferencia bancaria desde dashboard de MP

---

## 6. Checklist de seguridad (pendiente)

- [x] Mover `ACCESS_TOKEN` a Firebase Cloud Function ✅ HECHO
- [x] Validar propiedad de orden (solo el dueño puede pagar) ✅ HECHO
- [x] Recalcular precios en backend ✅ HECHO
- [ ] Configurar Webhook IPN en el panel de MP (punto 2.1) 🔴 PENDIENTE CRÍTICO
- [ ] Ambiente de pruebas (Sandbox) (punto 2.2) 🟡 PENDIENTE
- [ ] Activar expiración de preferencias (punto 2.3) 🟠 MEJORA
- [ ] Reintentar pago (punto 2.4) 🟠 MEJORA
- [ ] Notificación al admin (punto 2.5) 🟠 MEJORA
