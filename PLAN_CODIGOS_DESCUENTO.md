# Plan de Implementacion: Codigos de Descuento

## 1) Objetivo

Implementar un sistema de codigos de descuento compartibles, similar en operacion al sistema de codigos de cliente frecuente, pero aplicado al flujo de compra en tienda y checkout.

Debe permitir:

- Crear codigos de descuento desde admin
- Compartir codigos facilmente
- Definir descuento por porcentaje o por monto fijo en pesos
- Aplicar el codigo en checkout antes de pagar
- Reflejar el descuento en el total final de la orden

---

## 2) Contexto actual aprovechable

Ya existe un patron funcional para codigos en:

- frequentCustomerCodes (gestion, activacion/desactivacion, compartir, copiar)
- pantalla admin de codigos
- servicios Firestore para validar y registrar uso

La idea es reutilizar el mismo enfoque de UX y administracion, pero con reglas de negocio para descuentos de compra.

---

## 3) Alcance funcional (MVP)

### 3.1 Admin: gestion de codigos de descuento

- Crear codigo
- Definir tipo de descuento:
  - percentage
  - fixed_amount
- Definir valor:
  - percentage: 1-100
  - fixed_amount: en pesos, mayor a 0
- Definir estado: activo/inactivo
- Definir vigencia: fecha inicio y fecha fin (opcional)
- Definir limites de uso:
  - maxUses (global)
  - maxUsesPerUser (por usuario)
- Definir reglas opcionales:
  - compra minima
  - tope de descuento (muy importante para porcentaje)
- Acciones rapidas:
  - copiar codigo
  - compartir por Web Share / WhatsApp
  - activar/desactivar
  - eliminar

### 3.2 Cliente: uso del codigo en checkout

- Campo para ingresar codigo en checkout
- Boton Aplicar
- Mensaje de validacion clara:
  - codigo invalido
  - expirado
  - inactivo
  - limite alcanzado
  - no cumple compra minima
- Mostrar desglose:
  - subtotal
  - envio
  - descuento
  - total final
- Permitir quitar codigo antes de pagar

### 3.3 Orden y pago

- Guardar en la orden el snapshot del descuento aplicado
- El total que se manda a Mercado Pago debe coincidir con el total validado en backend

---

## 4) Modelo de datos propuesto

### 4.1 Coleccion: discountCodes

Documento sugerido:

```ts
{
  code: string,                 // unico, en mayusculas
  type: "percentage" | "fixed_amount",
  value: number,                // porcentaje o pesos
  isActive: boolean,

  minPurchaseAmount?: number,   // subtotal minimo
  maxDiscountAmount?: number,   // tope para percentage

  maxUses: number,              // limite global
  currentUses: number,
  maxUsesPerUser: number,       // limite por usuario

  startsAt?: Timestamp,
  endsAt?: Timestamp,

  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4.2 Registro de canjes por usuario (recomendado)

Opcion A (simple): array en el codigo (puede escalar mal)
Opcion B (recomendada): subcoleccion o coleccion separada

Coleccion sugerida: discountRedemptions

```ts
{
  codeId: string,
  code: string,
  userId: string,
  orderId: string,
  discountAmount: number,
  createdAt: Timestamp
}
```

Esto facilita auditoria, antifraude y limites por usuario.

---

## 5) Flujo tecnico recomendado

1. Cliente escribe codigo en checkout
2. Frontend llama endpoint backend (Cloud Function) para validar
3. Backend valida todo contra BD y calcula descuento real
4. Backend responde desglose calculado (no calculado en frontend)
5. Al crear la orden, backend vuelve a validar codigo y aplica en transaccion
6. Se incrementa currentUses de forma atomica
7. Se guarda registro de canje (discountRedemptions)
8. Se guarda snapshot de descuento en la orden
9. Se crea preferencia de Mercado Pago usando el total final backend

Nota: Nunca confiar en montos enviados por frontend para descuento/total.

---

## 6) Seguridad y controles recomendados

## Critico (debe estar desde el inicio)

- Validacion 100% en backend para:
  - vigencia
  - estado
  - limites globales
  - limites por usuario
  - compra minima
  - tope de descuento
- Recalcular subtotal desde productos en BD (evitar manipulacion del carrito)
- Transacciones Firestore para aplicar descuento + aumentar usos
- Idempotencia en creacion de orden/pago para evitar doble canje por reintentos
- No exponer listado completo de codigos a usuarios no admin
- Registrar auditoria: usuario, codigo, orden, monto, fecha

## Alto impacto (iteracion siguiente)

- Rate limit por IP/usuario en validacion de codigos
- Bloqueo temporal ante intentos fallidos repetidos
- Reglas de formato fuertes para codigo (longitud, charset)
- Generacion de codigos con alta entropia para evitar adivinacion

## Firestore Rules (linea base)

- discountCodes:
  - read para usuarios autenticados solo en validacion puntual
  - create/update/delete solo admin
- discountRedemptions:
  - create solo via backend confiable (ideal: solo Admin SDK)
  - lectura acotada (admin o dueno segun necesidad)

---

## 7) Cambios tecnicos esperados en el proyecto

### Frontend

- Checkout:
  - UI para ingresar/aplicar/quitar codigo
  - mostrar descuento y total actualizado
- Admin:
  - nueva vista o adaptacion de vista existente para codigos de descuento

### Servicios

- Nuevo servicio: discountCodes.service.ts (frontend)
- Ajustes en orders.service.ts para persistir discountSnapshot

### Backend (functions)

- Validar y aplicar descuentos server-side
- Endpoint para preview de descuento y endpoint para aplicar al crear orden

### Tipos

- Nuevo tipo DiscountCode
- Extender Order con:
  - discountCode
  - discountType
  - discountValue
  - discountAmount
  - totalBeforeDiscount

---

## 8) Plan por fases

## Fase 1 - Dominio y backend seguro ✅ COMPLETADA

- ✅ Definir modelos y tipos
- ✅ Crear colecciones y reglas
- ✅ Implementar Cloud Function de validacion
- ✅ Implementar aplicacion atomica en creacion de orden
- ✅ Implementar endpoint de canje (applyDiscountCode)
- ✅ Persistir snapshot en orden
- ✅ Prevenir doble canje en carrera (transacciones Firestore)

Criterio de salida:

- ✅ Ningun descuento se aplica sin validacion backend
- ✅ No hay doble canje por carrera o doble click

## Fase 2 - Checkout ✅ COMPLETADA

- ✅ Campo de codigo y boton aplicar
- ✅ Mostrar mensajes de error y resumen de descuento
- ✅ Permitir remover codigo
- ✅ Canje atomico antes de pagar

Criterio de salida:

- ✅ Usuario ve el total correcto antes de pagar
- ✅ El total final coincide con orden y con Mercado Pago

## Fase 3 - Admin y sharing ✅ COMPLETADA

- ✅ Alta/baja/edicion de codigos
- ✅ Activar/desactivar
- ✅ Copiar y compartir
- ✅ Indicadores de uso

Criterio de salida:

- ✅ Admin gestiona ciclo de vida completo del codigo

## Fase 4 - Hardening (EN PROGRESS)

- [ ] Rate limit por IP/usuario en validacion de codigos
- [ ] Bloqueo temporal ante intentos fallidos repetidos
- [ ] Metricas de conversion por codigo
- [ ] Dashboard de rendimiento de codigos

---

## STATUS ACTUAL

### Implementado y Funcionando

- ✅ Backend: validación segura de códigos + canje atómico
- ✅ Checkout: interfaz de código, aplicación y revalidación antes de pago
- ✅ Admin: crear, compartir, copiar, activar/desactivar códigos
- ✅ Firestore Rules: permisos de lectura/escritura seguros
- ✅ Órdenes: snapshot de descuento persistido
- ✅ Antifraude: bloqueo de doble canje en carrera (transacciones DB)

### Próximos Pasos Recomendados

1. **Métricas (Media)**: Agregar campos stats a discountCodes
2. **Rate Limiting (Alta)**: Implementar en backend
3. **Tests (Alta)**: Validar flujo completo

---

## 9) Casos de prueba minimos

- Aplica porcentaje correctamente
- Aplica monto fijo correctamente
- Respeta tope maximo en porcentaje
- No permite total negativo
- Rechaza codigo expirado/inactivo
- Rechaza por limite global y por usuario
- Rechaza cuando no cumple compra minima
- Evita doble canje en envios simultaneos
- Mantiene consistencia entre orden y Mercado Pago

---

## 10) Preguntas abiertas para cerrar diseno

- El descuento aplica sobre subtotal o subtotal + envio?
- Se permite combinar mas de un codigo?
- Se permiten codigos para categorias/productos especificos en MVP?
- Que pasa si el pago falla: se revierte el canje o se mantiene reservado?
- Quien puede crear codigos: todos los admin o solo admin principal?

---

## 11) Recomendacion practica de implementacion

Iniciar por backend y reglas antes de tocar UI de checkout. Si se empieza por UI primero, existe riesgo de fugas de seguridad y discrepancias de total en pago.
