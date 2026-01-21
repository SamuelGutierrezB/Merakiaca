# Plan de Proyecto: E-commerce Merakiaca

## 📋 Descripción General

**Merakiaca** es un e-commerce especializado en productos de tela (cojines y artículos similares) con personalización de colores y estampados. El proyecto incluye gestión de inventario, autenticación con Google, y un panel administrativo completo.

### Características Principales

- 🔐 Autenticación con Google Firebase
- 🛒 Carrito de compras persistente
- 🎨 Selección de colores y patrones de tela por producto
- 👨‍💼 Panel de administración completo
- 📦 Gestión de inventario (stock)
- 🖼️ Galería de patrones/estampados por producto
- 💰 Gestión de precios

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend:**

- React 19 + TypeScript
- Vite (Rolldown)
- TailwindCSS 4
- React Router DOM (a instalar)
- Zustand o Context API (gestión de estado)

**Backend:**

- Firebase Authentication (Google Sign-In)
- Firestore Database
- Firebase Storage (imágenes de productos y patrones)
- Firebase Hosting
- Mercado Pago (Pasarela de pagos)

**Herramientas:**

- ESLint
- PostCSS
- TypeScript

---

## 📊 Estructura de Datos en Firestore

### Colección: `products`

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  category: string;
  mainImage: string; // URL de Firebase Storage
  images: string[]; // Galería de imágenes
  fabrics: FabricOption[]; // Opciones de tela/color
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

interface FabricOption {
  id: string;
  name: string; // ej: "Algodón Azul", "Patrón Flores"
  imageUrl: string; // Imagen del patrón/color
  priceModifier: number; // +/- al precio base
  stock: number; // Stock específico de esta opción
}
```

### Colección: `users`

```typescript
interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL: string;
  role: "customer" | "admin";
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

### Colección: `carts`

```typescript
interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Timestamp;
}

interface CartItem {
  productId: string;
  fabricId: string; // ID de la opción de tela seleccionada
  quantity: number;
  priceAtAdd: number; // Precio cuando se agregó al carrito
}
```

### Colección: `orders`

```typescript
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled";
  shippingAddress: Address;
  paymentMethod: "mercadopago";
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface OrderItem {
  productId: string;
  productName: string;
  fabricId: string;
  fabricName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}
```

### Colección: `categories`

```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  order: number;
}
```

---

## 🎯 Funcionalidades Principales

### 1. **Autenticación**

- [x] Login con Google (Firebase Auth)
- [x] Logout
- [x] Persistencia de sesión
- [x] Asignación de roles (admin/customer)
- [x] Protección de rutas admin

### 2. **Catálogo de Productos (Cliente)**

- [ ] Listado de productos con filtros
- [ ] Vista detallada de producto
- [ ] Selección de opciones de tela/color
- [ ] Visualización de stock disponible
- [ ] Búsqueda de productos
- [ ] Filtro por categorías

### 3. **Carrito de Compras**

- [ ] Agregar productos al carrito
- [ ] Modificar cantidad en carrito
- [ ] Eliminar productos del carrito
- [ ] Persistencia del carrito en Firestore
- [ ] Cálculo automático de totales
- [ ] Validación de stock

### 4. **Proceso de Compra**

- [ ] Formulario de dirección de envío
- [ ] Resumen de orden
- [ ] Integración con Mercado Pago
- [ ] Crear preferencia de pago
- [ ] Redirigir a Checkout Pro de Mercado Pago
- [ ] Webhook para notificaciones de pago
- [ ] Confirmación de orden
- [ ] Email de confirmación

### 5. **Panel de Administración**

#### Gestión de Productos

- [ ] Crear nuevo producto
- [ ] Editar producto existente
- [ ] Eliminar producto
- [ ] Activar/desactivar producto
- [ ] Subir imágenes del producto
- [ ] Gestión de stock general

#### Gestión de Opciones de Tela

- [ ] Agregar opción de tela/color a producto
- [ ] Subir imagen del patrón
- [ ] Editar nombre y precio modificador
- [ ] Gestionar stock por opción
- [ ] Eliminar opción de tela
- [ ] Reordenar opciones

#### Gestión de Categorías

- [ ] Crear categorías
- [ ] Editar categorías
- [ ] Eliminar categorías
- [ ] Asignar productos a categorías

#### Gestión de Órdenes

- [ ] Ver listado de órdenes
- [ ] Filtrar por estado
- [ ] Actualizar estado de orden
- [ ] Ver detalles de orden
- [ ] Generar reportes

#### Dashboard

- [ ] Resumen de ventas
- [ ] Productos más vendidos
- [ ] Alertas de stock bajo
- [ ] Gráficos de rendimiento

---

## 📁 Estructura de Carpetas del Proyecto

```
src/
├── assets/               # Imágenes, iconos estáticos
├── components/
│   ├── common/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── products/        # Componentes de productos
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   └── FabricSelector.tsx
│   ├── cart/            # Componentes del carrito
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   └── admin/           # Componentes de admin
│       ├── ProductForm.tsx
│       ├── FabricOptionForm.tsx
│       ├── OrderList.tsx
│       └── Dashboard.tsx
├── pages/
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── OrderConfirmation.tsx
│   ├── Login.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminProducts.tsx
│       ├── AdminOrders.tsx
│       └── AdminCategories.tsx
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useOrders.ts
├── services/            # Servicios de Firebase y pagos
│   ├── firebase.ts      # Configuración
│   ├── auth.service.ts
│   ├── products.service.ts
│   ├── cart.service.ts
│   ├── orders.service.ts
│   ├── storage.service.ts
│   └── mercadopago.service.ts
├── store/               # Estado global (Zustand/Context)
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── productsStore.ts
├── types/               # TypeScript interfaces
│   ├── product.types.ts
│   ├── user.types.ts
│   ├── cart.types.ts
│   └── order.types.ts
├── utils/               # Utilidades
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── routes/
│   ├── AppRouter.tsx
│   ├── PrivateRoute.tsx
│   └── AdminRoute.tsx
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🔄 Flujos de Usuario

### Flujo de Cliente

```
1. Landing → Login con Google → Home
2. Home → Ver Productos → Detalle de Producto
3. Detalle → Seleccionar Tela/Color → Agregar al Carrito
4. Carrito → Revisar Items → Checkout
5. Checkout → Ingresar Dirección → Confirmar Pago
6. Confirmación → Ver Estado de Orden
```

### Flujo de Admin

```
1. Login → Dashboard Admin
2. Dashboard → Gestión de Productos
3. Crear Producto → Subir Imágenes → Agregar Opciones de Tela
4. Subir Fotos de Patrones → Configurar Precios
5. Gestionar Stock → Activar Producto
6. Ver Órdenes → Actualizar Estados
```

---

## 🚀 Plan de Implementación por Fases

### **Fase 1: Configuración Base** (Semana 1)

- [ ] Instalar dependencias necesarias (Firebase, React Router, Zustand)
- [ ] Configurar Firebase (Authentication, Firestore, Storage)
- [ ] Configurar estructura de carpetas
- [ ] Crear tipos TypeScript base
- [ ] Implementar sistema de autenticación con Google
- [ ] Crear layout base (Header, Footer)
- [ ] Configurar enrutamiento

### **Fase 2: Gestión de Productos - Admin** (Semana 2-3)

- [ ] Crear página de admin dashboard
- [ ] Implementar CRUD de productos
- [ ] Sistema de carga de imágenes
- [ ] Gestión de opciones de tela/patrones
- [ ] Sistema de categorías
- [ ] Validación de formularios

### **Fase 3: Catálogo para Clientes** (Semana 3-4)

- [ ] Página de listado de productos
- [ ] Página de detalle de producto
- [ ] Componente selector de tela
- [ ] Sistema de filtros y búsqueda
- [ ] Optimización de imágenes
- [ ] Vista responsive

### **Fase 4: Carrito de Compras** (Semana 4-5)

- [ ] Implementar estado del carrito (Zustand)
- [ ] Componente de carrito drawer/modal
- [ ] Persistencia en Firestore
- [ ] Sincronización entre sesiones
- [ ] Validación de stock
- [ ] Cálculo de totales

### **Fase 5: Proceso de Checkout** (Semana 5-6)

- [ ] Formulario de dirección de envío
- [ ] Página de resumen de orden
- [ ] Integración con SDK de Mercado Pago
- [ ] Crear preferencia de pago con items del carrito
- [ ] Implementar Checkout Pro (redirección)
- [ ] Configurar URLs de retorno (success/failure/pending)
- [ ] Implementar webhook para IPN (notificaciones de pago)
- [ ] Validar pagos en el backend
- [ ] Creación de órdenes en Firestore
- [ ] Página de confirmación
- [ ] Actualización de stock

### **Fase 6: Gestión de Órdenes - Admin** (Semana 6-7)

- [ ] Listado de órdenes
- [ ] Filtros por estado
- [ ] Actualización de estados
- [ ] Vista detallada de orden
- [ ] Sistema de notificaciones
- [ ] Reportes básicos

### **Fase 7: Mejoras y Optimización** (Semana 7-8)

- [ ] Implementar dashboard con estadísticas
- [ ] Optimización de rendimiento
- [ ] Manejo de errores mejorado
- [ ] Alertas de stock bajo
- [ ] Implementar búsqueda avanzada
- [ ] Sistema de reviews (opcional)
- [ ] Testing básico

### **Fase 8: Despliegue y Producción** (Semana 8)

- [ ] Configurar variables de entorno
- [ ] Optimizar build de producción
- [ ] Configurar reglas de seguridad de Firestore
- [ ] Desplegar en Firebase Hosting
- [ ] Monitoreo y analytics
- [ ] Documentación

---

## 🔒 Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    // Categories collection
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Carts collection
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Orders collection
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isSignedIn();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

## 📦 Dependencias a Instalar

```bash
# Core
npm install firebase
npm install react-router-dom
npm install zustand

# Formularios
npm install react-hook-form
npm install zod

# UI Components
npm install @headlessui/react
npm install @heroicons/react
npm install react-hot-toast

# Pagos
npm install mercadopago
npm install @mercadopago/sdk-react

# Utilities
npm install clsx
npm install date-fns

# Types
npm install -D @types/react-router-dom
```

---

## 🎨 Consideraciones de Diseño

### Paleta de Colores

- Usar colores cálidos y acogedores para productos de tela
- Contrastar con elementos de acción (botones, CTAs)
- Modo claro prioritario (opcionalmente agregar modo oscuro)

### UX para Selector de Tela

- Mostrar miniaturas grandes y claras de patrones
- Permitir zoom en las imágenes de tela
- Indicar claramente el stock de cada opción
- Mostrar diferencia de precio si aplica

### Responsive Design

- Mobile-first approach
- Drawer para carrito en móvil
- Grid adaptable para productos
- Navegación optimizada para touch

---

## 📈 Métricas y Analytics

### A Implementar

- Google Analytics 4
- Firebase Analytics
- Eventos de conversión:
  - Productos vistos
  - Agregados al carrito
  - Compras completadas
  - Abandono de carrito

### KPIs a Monitorear

- Tasa de conversión
- Ticket promedio
- Productos más vendidos
- Tasa de abandono de carrito
- Tiempo promedio en sitio

---

## 🔐 Variables de Entorno

```env
# Firebase Config
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Mercado Pago
VITE_MERCADOPAGO_PUBLIC_KEY=
VITE_MERCADOPAGO_ACCESS_TOKEN=
VITE_MERCADOPAGO_SUCCESS_URL=
VITE_MERCADOPAGO_FAILURE_URL=
VITE_MERCADOPAGO_PENDING_URL=

# Admin Emails (para asignar rol de admin)
VITE_ADMIN_EMAILS=admin@merakiaca.com,admin2@merakiaca.com
```

---

## 📝 Notas Adicionales

### Consideraciones de Stock

- Validar stock antes de agregar al carrito
- Validar stock antes de confirmar compra
- Actualizar stock atómicamente en Firestore
- Implementar reserva temporal durante checkout

### Gestión de Imágenes

- Optimizar imágenes antes de subir (WebP, compresión)
- Generar thumbnails automáticamente
- Usar lazy loading
- CDN de Firebase para mejor rendimiento

### SEO

- Metadata dinámica por producto
- Sitemap.xml
- Robots.txt
- Open Graph tags
- Schema.org markup para productos

### Integración con Mercado Pago

#### Flujo de Pago

1. Usuario completa el checkout
2. Backend crea preferencia de pago con Mercado Pago SDK
3. Usuario es redirigido a Checkout Pro de Mercado Pago
4. Usuario completa el pago
5. Mercado Pago notifica mediante IPN (webhook)
6. Backend valida el pago y actualiza el estado de la orden
7. Usuario es redirigido a página de confirmación

#### Configuración Necesaria

- Crear cuenta en Mercado Pago para vendedores
- Obtener credenciales (Public Key y Access Token)
- Configurar URLs de notificación (webhooks)
- Configurar URLs de retorno (success, failure, pending)
- Habilitar IPN en el panel de Mercado Pago

#### Consideraciones de Seguridad

- **NUNCA** exponer el Access Token en el frontend
- Validar todas las notificaciones de pago en el backend
- Usar HTTPS para los webhooks
- Verificar la firma de las notificaciones IPN
- Implementar idempotencia en el procesamiento de pagos

#### Estados de Pago

- `pending`: Pago pendiente (efectivo, transferencia)
- `approved`: Pago aprobado
- `authorized`: Pago autorizado (captura pendiente)
- `in_process`: En proceso de revisión
- `in_mediation`: Disputa iniciada
- `rejected`: Pago rechazado
- `cancelled`: Pago cancelado
- `refunded`: Pago reembolsado
- `charged_back`: Contracargo

---

## ✅ Próximos Pasos Inmediatos

1. **Configurar Firebase completamente**
   - Crear proyecto en Firebase Console
   - Activar Authentication (Google Provider)
   - Crear base de datos Firestore
   - Activar Storage
   - Configurar reglas de seguridad

2. **Instalar dependencias**

   ```bash
   npm install firebase react-router-dom zustand react-hook-form zod @headlessui/react @heroicons/react react-hot-toast clsx date-fns mercadopago @mercadopago/sdk-react
   ```

3. **Crear estructura de carpetas base**

4. **Implementar sistema de autenticación**

5. **Crear primer CRUD de productos en admin**

---

**Fecha de Creación:** 20 de enero de 2026  
**Última Actualización:** 20 de enero de 2026  
**Versión:** 1.0
