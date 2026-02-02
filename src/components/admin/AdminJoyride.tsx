import Joyride, { STATUS } from "react-joyride";
import type { Step, CallBackProps, TooltipRenderProps } from "react-joyride";
import { useState, useEffect } from "react";

interface AdminJoyrideProps {
  page:
    | "dashboard"
    | "products"
    | "orders"
    | "categories"
    | "product-form"
    | "frequent-codes";
}

// Tooltip personalizado en español
const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        maxWidth: "400px",
        padding: "20px",
      }}
    >
      {/* Contenido */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#333",
          }}
        >
          {step.content}
        </div>
      </div>

      {/* Footer con progreso y botones */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        {/* Indicador de progreso en español */}
        <div style={{ color: "#666", fontSize: "14px" }}>
          Paso {index + 1} de {size}
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: "10px" }}>
          {index > 0 && (
            <button
              {...backProps}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "14px",
                padding: "8px 16px",
              }}
            >
              Atrás
            </button>
          )}

          {continuous && !isLastStep && (
            <button
              {...primaryProps}
              style={{
                backgroundColor: "#2391C3",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                padding: "10px 20px",
              }}
            >
              Siguiente
            </button>
          )}

          {isLastStep && (
            <button
              {...closeProps}
              style={{
                backgroundColor: "#2391C3",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                padding: "10px 20px",
              }}
            >
              Terminar
            </button>
          )}

          {!isLastStep && (
            <button
              {...skipProps}
              style={{
                background: "transparent",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "13px",
                padding: "8px 16px",
                textDecoration: "underline",
              }}
            >
              Saltar tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const tours: Record<string, Step[]> = {
  dashboard: [
    {
      target: "[data-tour='dashboard-welcome']",
      content:
        "¡Madre! Bienvenida al panel de administración de Merakiaca. Aquí puedes gestionar toda tu tienda.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='dashboard-products']",
      content:
        "Desde aquí puedes crear, editar y eliminar tus productos. Es la sección más importante.",
    },
    {
      target: "[data-tour='dashboard-orders']",
      content:
        "Aquí verás todas las órdenes de compra que te hagan los clientes.",
    },
    {
      target: "[data-tour='dashboard-categories']",
      content:
        "Las categorías te ayudan a organizar tus productos para que los clientes encuentren más fácil lo que buscan.",
    },
  ],
  products: [
    {
      target: "[data-tour='products-back']",
      content:
        "Madre, este botón te regresa al Panel de Administración. Úsalo cuando termines aquí.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='products-create']",
      content:
        "Con este botón puedes crear nuevos productos. ¡Haz clic aquí para agregar tus cojines herbales!",
    },
    {
      target: "[data-tour='products-table']",
      content:
        "En esta tabla verás todos tus productos. Puedes ver la imagen, nombre, precio, stock y estado de cada uno.",
    },
    {
      target: "[data-tour='products-actions']",
      content:
        "Estos botones te permiten editar o eliminar productos. El lápiz es para editar, la basura para eliminar.",
    },
  ],
  orders: [
    {
      target: "[data-tour='orders-back']",
      content: "Madre, este botón te regresa al Panel de Administración.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='orders-title']",
      content: "Aquí verás todas las órdenes de compra que hagan tus clientes.",
    },
    {
      target: "[data-tour='orders-table']",
      content:
        "En esta tabla aparecerán todas las órdenes. Podrás ver el nombre del cliente, qué compró, cuánto pagó, el estado del pedido y la fecha. Haz clic en cualquier orden para ver más detalles.",
    },
  ],
  categories: [
    {
      target: "[data-tour='categories-back']",
      content: "Madre, este botón te regresa al Panel de Administración.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='categories-title']",
      content:
        "Las categorías ayudan a organizar tus productos. Por ejemplo: Cojines, Almohadas, Terapéuticos, etc.",
    },
    {
      target: "[data-tour='categories-list']",
      content:
        "Aquí están todas tus categorías. Cada una muestra cuántos productos tiene.",
    },
    {
      target: "[data-tour='categories-create']",
      content:
        "Con este botón puedes crear nuevas categorías cuando necesites organizar mejor tus productos.",
    },
  ],
  "product-form": [
    {
      target: "[data-tour='form-back']",
      content: "Madre, este botón te regresa a la lista de productos.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='form-title']",
      content:
        "Aquí crearás o editarás tus productos. Vamos a ver cada campo paso a paso.",
    },
    {
      target: "[data-tour='form-image']",
      content:
        "Primero, sube una imagen de tu producto. Esta será la foto principal que verán los clientes.",
    },
    {
      target: "[data-tour='form-name']",
      content:
        "Ponle un nombre atractivo a tu producto. Por ejemplo: 'Cojín Herbal Relajante de Lavanda'.",
    },
    {
      target: "[data-tour='form-description']",
      content:
        "Describe tu producto: qué hierbas tiene, para qué sirve, cómo se usa. ¡Sé detallada!",
    },
    {
      target: "[data-tour='form-price']",
      content:
        "Establece el precio base del producto. Luego podrás ajustar precios según la tela.",
    },
    {
      target: "[data-tour='form-category']",
      content:
        "Elige la categoría donde aparecerá tu producto. Si no ves la categoría que necesitas, créala desde el módulo de Categorías.",
    },
    {
      target: "[data-tour='form-active']",
      content:
        "Con esta casilla decides si el producto está visible para los clientes. Desmárcala si aún no lo quieres publicar.",
    },
    {
      target: "[data-tour='form-submit']",
      content:
        "Cuando termines de llenar todo, haz clic aquí para guardar. Si es un producto nuevo, después podrás agregar las opciones de tela.",
    },
    {
      target: "[data-tour='form-fabrics']",
      content:
        "Una vez creado el producto, aquí podrás agregar diferentes opciones de tela: colores base, patrones personalizados, y configurar el precio y stock de cada uno.",
    },
    {
      target: "[data-tour='form-add-fabric']",
      content:
        "Con este botón agregas nuevas telas personalizadas. Puedes usar un color sólido con el picker o subir una imagen de patrón.",
    },
  ],
  "frequent-codes": [
    {
      target: "[data-tour='codes-back']",
      content: "Madre, este botón te regresa al Panel de Administración.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='codes-title']",
      content:
        "Los códigos de cliente frecuente permiten que tus clientes leales comenten productos sin necesidad de haberlos comprado. ¡Es tu programa de fidelidad!",
    },
    {
      target: "[data-tour='codes-create']",
      content:
        "Con este botón puedes crear nuevos códigos. Cada código puede tener un límite de usos personalizado.",
    },
    {
      target: "[data-tour='codes-form']",
      content:
        "Aquí creas el código: elige un nombre memorable (se convertirá a mayúsculas) y define cuántos usuarios pueden usarlo. Por ejemplo: CLIENTE2024 con 100 usos.",
    },
    {
      target: "[data-tour='codes-list']",
      content:
        "Aquí verás todos tus códigos activos e inactivos. Cada tarjeta muestra el estado, uso actual, y cuántos clientes lo han usado.",
    },
    {
      target: "[data-tour='codes-actions']",
      content:
        "Puedes Copiar el código para compartirlo, usar el botón Compartir para enviarlo por WhatsApp u otra app, Activar/Desactivar sin eliminarlo, o Eliminarlo permanentemente si ya no lo necesitas.",
    },
  ],
};

export default function AdminJoyride({ page }: AdminJoyrideProps) {
  const [run, setRun] = useState(false);
  const storageKey = `joyride-completed-${page}`;

  useEffect(() => {
    // Verificar si ya completó el tour
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Esperar un poco para que la página cargue
      setTimeout(() => setRun(true), 500);
    }
  }, [storageKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(storageKey, "true");
    }
  };

  const steps = tours[page] || [];

  if (steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton={false}
      callback={handleJoyrideCallback}
      disableOverlayClose
      hideCloseButton
      spotlightClicks={false}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: "#fff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
