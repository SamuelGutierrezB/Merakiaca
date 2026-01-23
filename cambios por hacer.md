Por hacer:

En progreso:

Terminado:

- Diálogos de confirmación con Headless UI ✅
  - Reemplazados todos los confirm() nativos
  - Componente ConfirmDialog reutilizable
  - Diálogos en: eliminación de categorías, productos, órdenes y reseñas
  - UI consistente con animaciones y transiciones
- Eliminado simulador de pago ✅
  - Flujo simplificado: orden → confirmación → mis órdenes
  - Admin gestiona pagos manualmente por WhatsApp
  - Admin puede cambiar estado de pago y estado de orden
- Simulador de pago de Mercado Pago ✅
  - Página de simulación con estados de pago
  - Actualización automática del estado de la orden
  - 90% de probabilidad de éxito en la simulación
  - Reducción de stock solo cuando el pago es aprobado
  - Redirecciones automáticas según resultado
- Gestión mejorada del estado "Pendiente" ✅
  - Estado de pago separado del estado de la orden
  - Estados de pago: pendiente, aprobado, rechazado, cancelado
  - Estados de orden: pendiente de pago, procesando, enviado, entregado, cancelado
  - Los administradores pueden cambiar el estado de la orden
  - Solo se permite cambiar estado cuando el pago está aprobado
- Sistema de comentarios y calificaciones con estrellas (1-5) ✅
  - Máximo 3 comentarios por usuario por producto
  - Solo usuarios que han comprado el producto pueden comentar
  - Sistema de calificación promedio
  - Posibilidad de eliminar comentarios propios
- Múltiples fotos por producto con galería y miniaturas ✅
- Múltiples categorías por producto con selector de checkboxes ✅
- Validaciones de inputs completas (teléfono, nombre, dirección, precios, etc.) ✅
- El stock se resta automáticamente cuando se crea una orden ✅
- El stock se define con las telas, se quitó el input de stock del formulario ✅
- Stock ahora se calcula sumando la cantidad de todas las telas ✅
- La categoría se carga correctamente cuando se edita un producto ✅
- Scroll automático cuando se presiona sobre agregar una tela ✅
- Se muestra siempre el stock por tela al estar viendo un producto ✅
- Imágenes muestran la imagen completa sin deformar (object-contain) ✅
- Sistema de recolección en sucursales Casa Blanca ✅
- Mapa interactivo con marcadores y animaciones ✅
- Selector de sucursales en Checkout ✅
- Sección de Instrucciones de Uso con iconos y precauciones ✅
- Cambio de nombre a "Meraki aca®" con "aca" en minúsculas ✅
- Cambio de color del footer de rojo a morado ✅
- Textos actualizados en Home (hierbas y semillas naturales) ✅
- Símbolo de marca registrada ® agregado ✅
