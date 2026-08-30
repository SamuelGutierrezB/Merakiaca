# Códigos de Cliente Frecuente

## Descripción

Los códigos de cliente frecuente permiten a usuarios registrados comentar en productos sin necesidad de haber realizado una compra previa. Esta funcionalidad está diseñada para clientes leales que quieren compartir su opinión.

## ¿Cómo funciona?

### Para usuarios:

1. Al visitar un producto sin haberlo comprado, verás la opción "Comenta con código de cliente frecuente"
2. Al hacer clic, se abrirá un diálogo para ingresar el código
3. Si el código es válido, podrás dejar hasta 3 reseñas en ese producto
4. Los comentarios con código de cliente frecuente aparecen con una etiqueta especial
5. Puedes eliminar tus propios comentarios en cualquier momento

### Para administradores:

#### Crear códigos en Firebase Console

1. Ve a Firebase Console → Firestore Database
2. Crea un nuevo documento en la colección `frequentCustomerCodes`
3. Agrega los siguientes campos:

```javascript
{
  code: "CLIENTE2024",           // Código único en mayúsculas
  isActive: true,                // Si el código está activo
  maxUses: 100,                  // Número máximo de usos permitidos
  currentUses: 0,                // Contador de usos actuales
  usedBy: [],                    // Array de IDs de usuarios que lo usaron
  createdAt: new Date(),         // Fecha de creación
  updatedAt: new Date()          // Fecha de última actualización
}
```

#### Ejemplo de código:

```javascript
{
  code: "VIP2024",
  isActive: true,
  maxUses: 50,
  currentUses: 0,
  usedBy: [],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Características

✅ **Validación en tiempo real**: Los códigos se validan antes de permitir comentar
✅ **Control de usos**: Cada código tiene un límite de usos configurables
✅ **Identificación visual**: Los comentarios con código muestran una etiqueta especial
✅ **Gestión individual**: Los usuarios pueden eliminar sus propios comentarios
✅ **Seguridad**: Solo usuarios autenticados pueden usar códigos

## Reglas de negocio

- Los usuarios deben estar autenticados para usar un código
- Cada usuario puede dejar hasta 3 reseñas por producto (igual que con compras)
- Los códigos pueden ser desactivados sin eliminarlos de la base de datos
- Los administradores pueden eliminar cualquier comentario
- Los usuarios solo pueden eliminar sus propios comentarios

## Casos de uso

1. **Programa de lealtad**: Otorgar códigos a clientes frecuentes
2. **Eventos especiales**: Códigos temporales para eventos o promociones
3. **Influencers**: Códigos especiales para embajadores de marca
4. **Beta testers**: Permitir comentarios de usuarios de prueba

## Consideraciones técnicas

- Los códigos se almacenan en mayúsculas automáticamente
- La validación incluye verificación de estado activo y límite de usos
- Los comentarios mantienen registro del código usado para trazabilidad
- El sistema previene que un mismo usuario use el código múltiples veces en el mismo producto

## Seguridad (Firestore Rules)

Las reglas de Firestore ya están configuradas en `firestore.rules`:

```javascript
match /frequentCustomerCodes/{codeId} {
  // Los usuarios autenticados pueden leer códigos para validación
  allow read: if isSignedIn();

  // Solo admins pueden crear, actualizar o eliminar códigos
  allow create, update, delete: if isAdmin() || isAdminEmail();
}
```

## Ejemplo de script para crear códigos

Si necesitas crear múltiples códigos programáticamente, aquí tienes un ejemplo que puedes ejecutar en la consola de Firebase (Functions o directamente en la consola de Firebase):

```javascript
// Ejemplo: Crear 10 códigos de cliente frecuente
const admin = require("firebase-admin");
const db = admin.firestore();

async function createFrequentCustomerCodes() {
  const batch = db.batch();

  const codes = [
    { code: "VIP2024", maxUses: 100 },
    { code: "CLIENTE2024", maxUses: 50 },
    { code: "ESPECIAL2024", maxUses: 30 },
    { code: "PREMIUM2024", maxUses: 75 },
    { code: "ELITE2024", maxUses: 150 },
  ];

  codes.forEach(({ code, maxUses }) => {
    const docRef = db.collection("frequentCustomerCodes").doc();
    batch.set(docRef, {
      code: code,
      isActive: true,
      maxUses: maxUses,
      currentUses: 0,
      usedBy: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log("Códigos creados exitosamente");
}

createFrequentCustomerCodes();
```

## Deployment

Después de implementar estos cambios:

1. **Actualizar reglas de Firestore**:
   - **Opción A (Recomendada)**: Desde Firebase Console
     - Ve a Firebase Console → Firestore Database → Rules
     - Agrega esta regla en la sección apropiada:
     ```javascript
     match /frequentCustomerCodes/{codeId} {
       allow read: if isSignedIn();
       allow create, update, delete: if isAdmin() || isAdminEmail();
     }
     ```

     - Publica las reglas
   - **Opción B**: Desde la terminal (requiere permisos)
     ```bash
     firebase deploy --only firestore:rules
     ```

2. **Acceder a la interfaz de administración**:
   - Inicia sesión como administrador
   - Ve a `/admin` (Panel de Administración)
   - Haz clic en "Códigos" en los accesos rápidos
   - O navega directamente a `/admin/codigos-frecuentes`

3. **Crear códigos desde la interfaz**:
   - Haz clic en el botón "Crear Código"
   - Ingresa el código (ej: CLIENTE2024) - se convertirá automáticamente a mayúsculas
   - Define los usos máximos (número de usuarios que pueden usar el código)
   - Haz clic en "Crear Código"

4. **Gestionar códigos existentes**:
   - **Copiar**: Copia el código al portapapeles para compartir fácilmente
   - **Compartir**: Usa Web Share API para compartir el código con mensaje personalizado
   - **Activar/Desactivar**: Cambia el estado del código sin eliminarlo permanentemente
   - **Eliminar**: Elimina permanentemente el código de la base de datos

5. **Probar la funcionalidad**:
   - Visita un producto sin haberlo comprado
   - Haz clic en "Comenta con código de cliente frecuente"
   - Ingresa un código válido creado en el paso anterior
   - Verifica que puedas comentar
   - Verifica que puedas eliminar tu comentario

## Interfaz de Administración

La nueva interfaz incluye:

✅ **Tarjetas visuales** para cada código con información completa
✅ **Barra de progreso** para ver el porcentaje de uso
✅ **Badges de estado** (Activo/Inactivo)
✅ **Acciones rápidas**: Copiar, Compartir, Activar/Desactivar, Eliminar
✅ **Formulario de creación** integrado
✅ **Confirmación** antes de eliminar códigos
✅ **Diseño responsive** que funciona en móviles y desktop

- Verifica que puedas comentar
- Verifica que puedas eliminar tu comentario
