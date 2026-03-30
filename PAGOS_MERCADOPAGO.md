# Integración de Pagos — Mercado Pago

> Última actualización: 29 de marzo de 2026

---

## 1. Estado actual — qué está implementado

### 1.1 Flujo general (front-end)

```
Usuario llena Checkout
        ↓
Se crea la orden en Firestore  (paymentStatus: "pending")
        ↓
Se crea la Preferencia en MP API  (POST /checkout/preferences)
        ↓
Se guarda preferenceId en la orden
        ↓
Browser redirige a init_point de Mercado Pago
        ↓
Usuario paga en la plataforma de MP
        ↓
MP redirige a /orden/success | /orden/failure | /orden/pending
        ↓
OrderResult.tsx actualiza paymentStatus en Firestore
```

### 1.2 Archivos clave

| Archivo                               | Responsabilidad                                            |
| ------------------------------------- | ---------------------------------------------------------- |
| `src/services/mercadopago.service.ts` | Llama a la API de MP para crear la preferencia             |
| `src/pages/Checkout.tsx`              | Formulario de datos + dispara la preferencia               |
| `src/pages/OrderResult.tsx`           | Landing de vuelta de MP. Actualiza estado de la orden      |
| `src/services/orders.service.ts`      | `updateOrderPaymentStatus`, `updateOrderPreferenceId`      |
| `src/routes/AppRouter.tsx`            | Rutas `/orden/success`, `/orden/failure`, `/orden/pending` |
| `.env.production`                     | Variables de entorno con credenciales de MP                |

### 1.3 Variables de entorno configuradas (`.env.production`)

| Variable                        | Valor                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| `VITE_MERCADOPAGO_PUBLIC_KEY`   | `APP_USR-143aba6d-7920-4259-b862-5082cb03509f`              |
| `VITE_MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-6819053407099765-032923-…` _(ver .env.production)_ |
| `VITE_MERCADOPAGO_SUCCESS_URL`  | `https://merakiaca-3a05a.web.app/orden/success`             |
| `VITE_MERCADOPAGO_FAILURE_URL`  | `https://merakiaca-3a05a.web.app/orden/failure`             |
| `VITE_MERCADOPAGO_PENDING_URL`  | `https://merakiaca-3a05a.web.app/orden/pending`             |

> **⚠️ Importante:** el archivo `.env.production` NO debe subirse a git. Verificar que está en `.gitignore`.

### 1.4 Parámetros que MP devuelve al redirigir

MP agrega estos query params a las URLs de retorno:

| Parámetro            | Descripción                                    |
| -------------------- | ---------------------------------------------- |
| `collection_id`      | ID del pago en MP                              |
| `collection_status`  | `approved` / `rejected` / `pending`            |
| `external_reference` | El `orderId` de Firestore que pasamos nosotros |
| `payment_type`       | Método de pago usado                           |
| `merchant_order_id`  | ID de la orden en MP                           |

### 1.5 Cómo se mapea el estado de pago

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

### 2.2 🔴 CRÍTICO — Access Token en el cliente

El `VITE_MERCADOPAGO_ACCESS_TOKEN` queda embebido en el bundle JS que descarga el navegador. Cualquier persona puede inspeccionarlo con DevTools.

**Solución recomendada:** mover la creación de la preferencia a una Firebase Cloud Function:

- El cliente llama a la función con los items y el orderId.
- La función (servidor) crea la preferencia usando el token (que vive solo en el servidor).
- La función devuelve el `init_point` al cliente.

### 2.3 🟡 IMPORTANTE — Ambiente de pruebas (Sandbox)

Actualmente el código siempre usa `init_point` (producción real). Para poder hacer pruebas sin procesar pagos reales hay que:

1. Crear cuentas de prueba en [mercadopago.com/developers → Cuentas de prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/test/accounts).
2. Obtener credenciales de test (`TEST-...`).
3. Agregar variable `VITE_APP_ENV=test` y en el servicio usar `sandbox_init_point` cuando el entorno sea test.

```ts
// Cambio sugerido en mercadopago.service.ts
const isTest = import.meta.env.VITE_APP_ENV === "test";
window.location.href = isTest
  ? preference.sandbox_init_point
  : preference.init_point;
```

### 2.4 🟡 IMPORTANTE — Validación del monto en back-end

El precio de los ítems viene del carrito del cliente (front-end). Un usuario malicioso podría manipular los valores. Lo correcto es que la Firebase Cloud Function (punto 2.2) recalcule el total desde los datos de Firestore antes de crear la preferencia, en lugar de confiar en los precios enviados por el cliente.

### 2.5 🟡 IMPORTANTE — Expiración de preferencias

Actualmente las preferencias no expiran (`expires: false`). Conviene activar expiración para no acumular preferencias abiertas:

```ts
expires: true,
expiration_date_from: new Date().toISOString(),
expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
```

### 2.6 🟠 MEJORA — Reintentar pago de una orden pendiente

Actualmente si el usuario falla el pago termina en `/carrito` sin ningún vínculo a su orden. Se debería:

- Guardar el `orderId` en la sesión antes de redirigir.
- En la pantalla de fallo, ofrecer botón "Reintentar pago" que crea una nueva preferencia para la misma orden (sin crear una orden duplicada).

### 2.7 🟠 MEJORA — Notificación al admin cuando llega un pago

No hay ningún mecanismo para avisar al equipo de Merakiaca cuando se aprueba un pago. Opciones:

- Firebase Cloud Function trigger en `onUpdate` de la colección `orders` que envíe un email o mensaje de WhatsApp/Telegram cuando `paymentStatus` cambia a `approved`.

### 2.8 🟠 MEJORA — Panel admin: detalle de pago MP

En `AdminOrders`, solo se muestra el `mercadoPagoPaymentId`. Sería útil agregar:

- Enlace directo al pago en el panel de MP.
- Visualización del método de pago (tarjeta, OXXO, transferencia, etc.).

### 2.9 🟢 MENOR — Página de resultado sin `external_reference`

Si MP redirige sin los query params (ej. usuario hace refresh en `/orden/success`), la pantalla muestra el mensaje de éxito pero **no actualiza ninguna orden** y no da contexto al usuario. Se puede mejorar detectando el caso y mostrando un mensaje genérico distinto.

---

## 3. Credenciales necesarias

### Producción (ya configuradas)

| Dato          | Valor                                          |
| ------------- | ---------------------------------------------- |
| Public Key    | `APP_USR-143aba6d-7920-4259-b862-5082cb03509f` |
| Client ID     | `6819053407099765`                             |
| Access Token  | ver `.env.production`                          |
| Client Secret | guardar en lugar seguro, NO en código          |

### Para pruebas (pendiente obtener)

Crear en: https://www.mercadopago.com.mx/developers/panel/app/6819053407099765/test-credentials

| Dato              | Valor                  |
| ----------------- | ---------------------- |
| Public Key TEST   | `TEST-...` (pendiente) |
| Access Token TEST | `TEST-...` (pendiente) |

### Tarjetas de prueba (cuando se tenga sandbox)

Consultar la lista oficial: https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## 4. Flujo de dinero real

- Los pagos aprobados **se acreditan directamente en la cuenta de MP** asociada a las credenciales.
- Para retirar el dinero: panel de MP → Dinero disponible → Transferir a cuenta bancaria.
- MP cobra comisión por transacción (~3.49% + IVA para tarjeta). Sin cargo para OXXO (el comprador paga la comisión).

---

## 5. Checklist para pasar a producción "segura"

- [ ] Mover `ACCESS_TOKEN` a Firebase Cloud Function (punto 2.2)
- [ ] Configurar Webhook IPN en el panel de MP (punto 2.1)
- [ ] Activar expiración de preferencias (punto 2.5)
- [ ] Recalcular precios en servidor (punto 2.4)
- [ ] Verificar que `.env.production` esté en `.gitignore`
- [ ] Probar flujo completo con cuentas de prueba antes de lanzar
- [ ] Configurar notificación al admin por pago aprobado (punto 2.7)
