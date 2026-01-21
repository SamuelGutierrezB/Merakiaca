import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminJoyride from "@/components/admin/AdminJoyride";

export default function AdminOrders() {
  const navigate = useNavigate();

  return (
    <>
      <AdminJoyride page="orders" />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header con botón atrás */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-tour="orders-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
            </button>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-bold text-gray-800"
              data-tour="orders-title"
            >
              Gestión de Órdenes
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los pedidos de tus clientes
            </p>
          </div>

          {/* Estado vacío */}
          <div
            className="bg-white rounded-lg shadow-md p-12 text-center"
            data-tour="orders-empty"
          >
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay órdenes todavía
            </h2>
            <p className="text-gray-600 mb-6">
              Las órdenes aparecerán aquí cuando los clientes realicen compras
            </p>
            <button
              onClick={() => navigate("/productos")}
              className="inline-flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Ver Productos
            </button>
          </div>

          {/* Info card */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Sobre las Órdenes
            </h3>
            <p className="text-blue-800 text-sm">
              Aquí podrás ver todas las órdenes de compra, cambiar su estado
              (pendiente, en proceso, enviado, entregado), ver detalles del
              cliente y productos ordenados. La integración con Mercado Pago
              permitirá procesar pagos automáticamente.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
