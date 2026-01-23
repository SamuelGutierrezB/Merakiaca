# Reglas de Seguridad de Firebase

Este archivo documenta las reglas de seguridad configuradas para Firestore y Storage.

## 📋 Archivos de Configuración

- **`firestore.rules`**: Reglas de seguridad para Firestore Database
- **`storage.rules`**: Reglas de seguridad para Storage (imágenes)
- **`firestore.indexes.json`**: Índices compuestos para optimizar queries
- **`firebase.json`**: Configuración general de Firebase

## 🔒 Reglas de Firestore

### Colección: `users`

- **Lectura**: Usuario dueño o admin
- **Creación**: Solo tu propio usuario al registrarte
- **Actualización**: Solo tu propio usuario
- **Eliminación**: Solo admins

### Colección: `products`

- **Lectura**: Todos (público)
- **Escritura**: Solo admins

### Colección: `categories`

- **Lectura**: Todos (público)
- **Escritura**: Solo admins

### Colección: `orders`

- **Lectura**: Usuario dueño de la orden o admins
- **Creación**: Usuario autenticado (su propia orden)
- **Actualización**: Solo admins
- **Eliminación**: Solo admins

### Colección: `carts`

- **Lectura**: Usuario dueño del carrito
- **Escritura**: Usuario dueño del carrito

### Colección: `wishlists`

- **Lectura**: Usuario dueño de la lista de favoritos o admins
- **Creación**: Usuario autenticado (su propia lista)
- **Actualización**: Usuario dueño de la lista
- **Eliminación**: Usuario dueño de la lista o admins

## 🖼️ Reglas de Storage

### Carpeta: `products/`

- **Lectura**: Todos (público)
- **Escritura**: Solo admins
- **Validación**: Solo imágenes, máximo 5MB

### Carpeta: `fabrics/`

- **Lectura**: Todos (público)
- **Escritura**: Solo admins
- **Validación**: Solo imágenes, máximo 5MB

### Carpeta: `users/`

- **Lectura**: Todos (público)
- **Escritura**: Usuario dueño de su carpeta
- **Validación**: Solo imágenes, máximo 5MB

### Carpeta: `categories/` y `banners/`

- **Lectura**: Todos (público)
- **Escritura**: Solo admins
- **Validación**: Solo imágenes, máximo 5MB

## 👥 Administradores

Los administradores se identifican por su email:

- `samugutibarona@gmail.com`
- `merakiaca.c@gmail.com`

Estos emails también están configurados en `.env` como `VITE_ADMIN_EMAILS`.

## 📊 Índices Compuestos

Los índices mejoran el rendimiento de las queries:

1. **Órdenes por usuario y fecha**
   - `userId` (ASC) + `createdAt` (DESC)

2. **Órdenes por estado y fecha**
   - `status` (ASC) + `createdAt` (DESC)

3. **Productos activos por fecha**
   - `isActive` (ASC) + `createdAt` (DESC)

4. **Productos por categoría y fecha**
   - `category` (ASC) + `createdAt` (DESC)

## 🚀 Desplegar las Reglas

### Primera vez - Instalar Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
```

### Inicializar proyecto (si no está inicializado):

```bash
firebase init
```

Seleccionar:

- ✅ Firestore
- ✅ Storage
- ✅ Hosting

### Desplegar solo las reglas:

```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar índices de Firestore
firebase deploy --only firestore:indexes

# Desplegar reglas de Storage
firebase deploy --only storage

# Desplegar todo junto
firebase deploy --only firestore,storage
```

### Desplegar todo (reglas + hosting):

```bash
npm run deploy
```

## 🧪 Probar las Reglas

### Desde Firebase Console:

1. Ir a Firestore Database
2. Click en "Rules" tab
3. Click en "Rules Playground"
4. Probar diferentes escenarios

### Desde código (Emuladores):

```bash
firebase emulators:start
```

Esto inicia emuladores locales para probar sin afectar producción.

## ⚠️ Importante

1. **Nunca** hagas que las reglas sean completamente abiertas (`allow read, write: if true;`)
2. **Siempre** valida que el usuario autenticado sea quien dice ser
3. **Siempre** valida el tamaño y tipo de archivos en Storage
4. **Revisa** los logs de Firebase para detectar intentos de acceso no autorizado

## 🔄 Actualizar Reglas

Cuando modifiques las reglas:

1. Edita `firestore.rules` o `storage.rules`
2. Prueba localmente con emuladores (opcional)
3. Despliega con `firebase deploy --only firestore:rules` o `firebase deploy --only storage`
4. Verifica en Firebase Console que las reglas se aplicaron

## 📝 Notas

- Las reglas de Firestore usan una sintaxis similar a JavaScript
- Las reglas se evalúan en orden y la primera que coincida se aplica
- `resource.data` = datos existentes
- `request.resource.data` = datos nuevos que se intentan escribir
- `request.auth` = información del usuario autenticado
