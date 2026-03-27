import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import OrderHistory from "@/components/common/OrderHistory";
import { useAuthStore } from "@/store/authStore";
import { getUserOrders } from "@/services/orders.service";
import { formatPrice } from "@/utils/formatters";
import type { Order } from "@/types/order.types";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pago pendiente",
  approved: "Pago aprobado",
  rejected: "Pago rechazado",
  cancelled: "Pago cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function MyOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserOrders(user.uid);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Error al cargar tus órdenes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    const date = (timestamp as any).toDate
      ? (timestamp as any).toDate()
      : new Date(timestamp as any);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Mis Órdenes</h1>
          <p className="text-gray-600 mb-8">
            Debes iniciar sesión para ver tus órdenes
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-8"
          style={{ color: "#2391C3" }}
        >
          Mis Órdenes
        </h1>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#2391C3] animate-spin" />
            <p className="text-gray-600">Cargando tus órdenes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="h-24 w-24 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No tienes órdenes todavía
            </h2>
            <p className="text-gray-600 mb-6">
              Cuando realices una compra, tus órdenes aparecerán aquí
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Orden #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full text-center ${
                          PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                          order.paymentStatus}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full text-center ${
                          STATUS_COLORS[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de productos */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Productos:
                  </p>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="text-gray-800">
                          {item.productName}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({item.fabricName})
                        </span>
                      </div>
                      <div className="text-gray-600">
                        {item.quantity} × {formatPrice(item.unitPrice)} ={" "}
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Historial de cambios */}
                {order.statusHistory?.length ||
                order.paymentStatusHistory?.length ? (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <OrderHistory
                      statusHistory={order.statusHistory}
                      paymentStatusHistory={order.paymentStatusHistory}
                    />
                  </div>
                ) : null}

                {/* Dirección de envío o recolección */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {order.shippingAddress.street.startsWith(
                      "Recolección en sucursal",
                    )
                      ? "Recolección en sucursal:"
                      : "Dirección de Envío:"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.street}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tel: {order.shippingAddress.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
