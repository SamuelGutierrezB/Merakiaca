# Lista de Mejoras para Merakiaca

Registro de ideas y funcionalidades pendientes, ordenadas por categoría y prioridad sugerida.

---

## 🔴 Alta Prioridad

### Notificaciones y Comunicación

- [ ] **Notificación por WhatsApp al admin** cuando llega una orden nueva (usando la API de WhatsApp Business o un link `wa.me` con mensaje prefabricado)
- [ ] **Notificación al cliente** cuando su orden cambia de estado (correo vía Firebase Extensions o Resend/SendGrid)
- [ ] **Alerta de stock bajo en admin** — mostrar badge/warning cuando un fabric option tiene ≤ 3 unidades

### Flujo de Pago

- [ ] **Reintentar pago** desde la página de resultado fallido — actualmente el usuario queda sin salida clara si el pago falla
- [ ] **Registrar `mpWebhook` en el panel de Mercado Pago** (paso manual pendiente para que el webhook funcione en producción; URL: `https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpWebhook`)

### Admin — Órdenes

- [ ] **Filtrar órdenes** por estado, estado de pago, sucursal y rango de fechas
- [ ] **Buscar orden** por nombre de cliente o número de orden
- [ ] **Exportar órdenes a CSV/Excel** para llevar registros externos

---

## 🟡 Media Prioridad

### Experiencia del Cliente

- [ ] **Página de seguimiento de orden** — URL pública `/orden/:id` que muestre el estado sin necesidad de iniciar sesión
- [ ] **Reordenar un pedido anterior** — botón en "Mis Órdenes" que rellena el carrito con los ítems de una orden previa
- [ ] **Guardar dirección de envío** — que el cliente no tenga que escribirla cada vez (guardar en perfil de usuario)
- [ ] **Cupones de descuento** — campo en el checkout para ingresar un código de descuento
- [ ] **Contador de productos en el carrito** en el header (badge con número)
- [ ] **Toast de "producto agregado"** con miniatura del producto y link al carrito

### Catálogo y Productos

- [ ] **Ordenar y filtrar productos** en la página principal: por precio, popularidad, novedad, categoría
- [ ] **Buscar productos** con barra de búsqueda (por nombre o descripción)
- [ ] **Etiquetas de "Nuevo" / "Agotado" / "Oferta"** en las tarjetas de producto
- [ ] **Zoom en imágenes** del detalle de producto al hacer hover o click
- [ ] **Descripción larga con formato enriquecido** (soportar saltos de línea o markdown básico en el campo de descripción)
- [ ] **Productos relacionados** al fondo de la página de detalle

### Admin — Gestión

- [ ] **Duplicar producto** — botón para copiar un producto existente como base para crear uno nuevo
- [ ] **Reordenar imágenes** de producto mediante drag & drop
- [ ] **Soft delete** para productos — marcar como inactivo en lugar de borrar permanentemente y perder historial de órdenes
- [ ] **Gestión de banners/sliders** del home desde el panel admin sin tocar código

---

## 🟢 Baja Prioridad / Ideas Futuras

### SEO y Marketing

- [ ] **Meta tags dinámicos** por página (Open Graph para compartir en WhatsApp/redes)
- [ ] **Sitemap.xml** generado automáticamente para los productos
- [ ] **Google Analytics / Firebase Analytics** para rastrear tráfico y conversiones
- [ ] **Sección de blog o tips de decoración** para mejorar posicionamiento orgánico

### Fidelización

- [ ] **Programa de puntos** — acumular puntos por compra y canjearlos como descuento
- [ ] **Sistema de referidos** — compartir link para obtener descuento en la próxima compra
- [ ] **Pop-up de suscripción** al newsletter con Mailchimp/Resend para campañas de correo

### UX / UI

- [ ] **Modo oscuro** (dark mode) con toggle en el header ✅
- [ ] **Animaciones de entrada** en secciones del Home (Framer Motion o CSS transitions) ✅
- [ ] **Skeleton loaders** en lugar de spinner de carga en listas de productos y órdenes ✅
- [ ] **Breadcrumbs** en páginas de categoría y detalle de producto ✅
- [ ] **Página 404 personalizada** con link al Home y productos destacados ✅
- [ ] **Pull to refresh** en móvil para "Mis Órdenes" ✅

### Técnico / Performance

- [ ] **Lazy loading de imágenes** con `loading="lazy"` o IntersectionObserver
- [ ] **Compresión de imágenes al subir** (antes de enviar a Firebase Storage) para reducir tamaño y tiempo de carga
- [ ] **Paginación o scroll infinito** en la lista de productos (actualmente carga todo)
- [ ] **Paginación en AdminOrders** — rendimiento al crecer el número de órdenes
- [ ] **Service Worker / PWA** para que el sitio funcione offline y se pueda instalar como app
- [ ] **Variables de entorno separadas** para staging vs producción (`.env.staging`)
- [ ] **Tests unitarios básicos** para servicios críticos (orders, products, mercadopago)

### Logística

- [ ] **Integración con servicio de mensajería** (ej: Correos de México, Estafeta) para calcular costo de envío automáticamente según código postal
- [ ] **Imprimir order slip** — PDF con los datos de la orden para empacar y enviar
- [ ] **Gestión de devoluciones** — estado "devuelto" y lógica para reponer stock

---

## ✅ Ya Implementado (referencia)

- Sistema de favoritos/wishlist
- Dashboard con estadísticas y gráficas (Recharts)
- Reseñas con calificación de estrellas (solo compradores)
- Historial de cambios de estado en órdenes
- Mapa interactivo de sucursales con recolección
- Múltiples imágenes por producto
- Múltiples categorías por producto
- Descuento por cliente frecuente con códigos
- Carrito persistente con Zustand
- Autenticación con Google (Firebase Auth)
- Pago con Mercado Pago Checkout Pro
- Webhook de Mercado Pago para actualizar estado sin depender del cliente
- Idempotencia en la reducción de stock (no se descuenta dos veces)
- Eliminar todas las órdenes con confirmación por select
- Guía interactiva (Joyride) para el panel admin
- Botones de acción rápida en órdenes (WhatsApp, copiar dirección, aprobar pago, ver en MP)
- **Modo oscuro** con toggle en el header (persistido en localStorage)
- **Animaciones fade-in-up** en el hero del Home + reveal al hacer scroll en secciones
- **Skeleton loaders** en lista de productos y órdenes del cliente
- **Breadcrumbs** en páginas de Productos y Detalle de Producto
- **Página 404 personalizada** con productos destacados y acceso al Home
- **Pull to refresh** en Mis Órdenes (móvil)
