import Joyride, { STATUS } from "react-joyride";
import type { Step, CallBackProps } from "react-joyride";
import { useState, useEffect } from "react";

interface AdminJoyrideProps {
  page: "dashboard" | "products" | "orders" | "categories";
}

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
        "Madre, este botón te regresa al dashboard principal. Úsalo cuando termines aquí.",
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
      content: "Madre, este botón te regresa al dashboard.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='orders-title']",
      content:
        "Aquí verás todas las órdenes de compra cuando los clientes empiecen a comprar.",
    },
    {
      target: "[data-tour='orders-empty']",
      content:
        "Por ahora no hay órdenes. Cuando alguien compre, aparecerán aquí con toda la información: qué compró, cuánto pagó, y a dónde enviarlo.",
    },
  ],
  categories: [
    {
      target: "[data-tour='categories-back']",
      content: "Madre, este botón te regresa al dashboard.",
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
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#2391C3",
          textColor: "#333",
          backgroundColor: "#fff",
          arrowColor: "#fff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: "#2391C3",
          fontSize: 14,
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: "8px",
        },
        buttonBack: {
          color: "#666",
          marginRight: 10,
        },
        buttonSkip: {
          color: "#999",
        },
      }}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Terminar",
        next: "Siguiente",
        skip: "Saltar tour",
      }}
    />
  );
}
