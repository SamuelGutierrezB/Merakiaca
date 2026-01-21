import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminJoyride from "@/components/admin/AdminJoyride";
import { getAllOrders } from "@/services/orders.service";
import { formatPrice } from "@/utils/formatters";
import type { Order } from "@/types/order.types";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Cargando órdenes...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Estado vacío */
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
          ) : (
            /* Tabla de órdenes */
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              data-tour="orders-table"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          // Por ahora solo mostramos un toast, luego podemos crear modal de detalles
                          toast.success(
                            "Funcionalidad de detalles próximamente",
                          );
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.shippingAddress.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.shippingAddress.city},{" "}
                            {order.shippingAddress.state}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.items.length} producto
                            {order.items.length !== 1 ? "s" : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items
                              .map((item) => item.productName)
                              .join(", ")
                              .slice(0, 50)}
                            {order.items
                              .map((item) => item.productName)
                              .join(", ").length > 50 && "..."}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-[#D7322D]">
                            {formatPrice(order.total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              STATUS_COLORS[order.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
