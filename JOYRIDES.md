# Guías Interactivas (Joyrides) para Administración

## 📖 Descripción

Las guías interactivas son tours paso a paso que aparecen la primera vez que visitas cada sección del panel de administración. Están diseñadas específicamente para ayudar a tu madre (o cualquier administrador no técnico) a entender cómo usar cada función.

## ✨ Características

- **Lenguaje amigable**: Usan un tono familiar y cercano ("Madre, este botón...")
- **Una sola vez**: Cada tour se muestra solo la primera vez que visitas la página
- **4 tours diferentes**:
  - Dashboard (Panel Principal)
  - Productos (Gestión de Inventario)
  - Órdenes (Gestión de Pedidos)
  - Categorías (Gestión de Categorías)

## 🎯 Tours Disponibles

### 1. Dashboard

- Bienvenida y descripción general
- Cómo acceder a productos
- Cómo ver órdenes
- Cómo gestionar categorías

### 2. Productos

- Botón para volver al dashboard
- Tabla de productos
- Acciones (editar/eliminar)
- Botón para crear nuevo producto

### 3. Órdenes

- Botón para volver al dashboard
- Título de la página
- Lista de órdenes (cuando haya)

### 4. Categorías

- Botón para volver al dashboard
- Título de la página
- Lista de categorías
- Botón para crear nueva categoría

## 🔄 Cómo Volver a Ver un Tour

Si quieres ver un tour nuevamente:

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la pestaña "Consola"
3. Escribe uno de estos comandos y presiona Enter:

```javascript
// Para volver a ver el tour del Dashboard
localStorage.removeItem("joyride-completed-dashboard");

// Para volver a ver el tour de Productos
localStorage.removeItem("joyride-completed-products");

// Para volver a ver el tour de Órdenes
localStorage.removeItem("joyride-completed-orders");

// Para volver a ver el tour de Categorías
localStorage.removeItem("joyride-completed-categories");

// Para ver TODOS los tours nuevamente
localStorage.removeItem("joyride-completed-dashboard");
localStorage.removeItem("joyride-completed-products");
localStorage.removeItem("joyride-completed-orders");
localStorage.removeItem("joyride-completed-categories");
```

4. Recarga la página (F5)

## 🎨 Personalización

Los tours están en el archivo: `src/components/admin/AdminJoyride.tsx`

### Colores del Tour

- Color principal: `#2391C3` (azul de la marca)
- Fondo: blanco
- Texto: negro (#333)

### Agregar Nuevos Pasos

Para agregar pasos a un tour existente:

1. Abre `src/components/admin/AdminJoyride.tsx`
2. Encuentra el objeto `tours`
3. Agrega un nuevo paso en el array correspondiente:

```typescript
{
  target: "[data-tour='nombre-del-elemento']",
  content: "Madre, aquí puedes...",
  disableBeacon: true, // Muestra el tooltip inmediatamente
}
```

4. En la página correspondiente, agrega el atributo `data-tour` al elemento:

```tsx
<button data-tour="nombre-del-elemento">Mi Botón</button>
```

## 📝 Notas Técnicas

- **Biblioteca**: React Joyride v2.9.3
- **Instalación**: `npm install react-joyride --legacy-peer-deps`
- **Compatibilidad**: Instalado con `--legacy-peer-deps` debido a React 19
- **Almacenamiento**: LocalStorage con clave `joyride-completed-{page}`
- **Idioma**: Español (locale configurado)

## 🔧 Solución de Problemas

### El tour no aparece

1. Verifica que la página tenga `<AdminJoyride page="nombre" />`
2. Verifica que los elementos tengan el atributo `data-tour`
3. Limpia el localStorage como se indica arriba

### El tour aparece cada vez

- Verifica que el localStorage esté funcionando en tu navegador
- Revisa la consola en busca de errores

### Añadir tour a nueva página

1. Agrega el tour en `AdminJoyride.tsx` en el objeto `tours`
2. Importa y agrega `<AdminJoyride page="nueva-pagina" />` en tu componente
3. Agrega atributos `data-tour` a los elementos importantes
