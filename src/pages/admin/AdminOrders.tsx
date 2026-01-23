import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Loader2, Package, MapPin, Phone, ShoppingBag } from "lucide-react";
import AdminJoyride from "@/components/admin/AdminJoyride";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import OrderHistory from "@/components/common/OrderHistory";
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "@/services/orders.service";
import { deleteOrder } from "@/services/orders.service";
import { formatPrice } from "@/utils/formatters";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order.types";
import { useAuthStore } from "@/store/authStore";
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

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({ isOpen: false, order: null });

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

  const handleDelete = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteDialog({ isOpen: true, order });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.order) return;

    try {
      await deleteOrder(deleteDialog.order.id);
      toast.success("Orden eliminada exitosamente");
      loadOrders();
      if (selectedOrder?.id === deleteDialog.order.id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error al eliminar la orden");
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus, user?.uid);
      toast.success("Estado actualizado exitosamente");
      loadOrders();

      // Actualizar la orden seleccionada si está abierta
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    newPaymentStatus: PaymentStatus,
  ) => {
    try {
      await updateOrderPaymentStatus(
        orderId,
        newPaymentStatus,
        undefined,
        user?.uid,
      );
      toast.success("Estado de pago actualizado exitosamente");
      loadOrders();

      // Actualizar la orden seleccionada si está abierta
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Error al actualizar el estado de pago");
    }
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
              <span className="hidden sm:inline">
                Volver al Panel de Administración
              </span>
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
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#2391C3] animate-spin" />
              <p className="text-gray-600">Cargando órdenes...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Estado vacío */
            <div
              className="bg-white rounded-lg shadow-md p-12 text-center"
              data-tour="orders-empty"
            >
              <Package className="h-24 w-24 mx-auto mb-4 text-gray-400" />
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
            <>
              {/* Tabla de órdenes para desktop */}
              <div
                className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden"
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-gray-50 cursor-pointer"
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
                            <div className="text-sm font-bold text-gray-900">
                              {formatPrice(order.total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${
                                  PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                                  "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                                  order.paymentStatus}
                              </span>
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${
                                  STATUS_COLORS[order.status] ||
                                  "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => handleDelete(order, e)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar orden"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vista de tarjetas para móvil/tablet */}
              <div className="lg:hidden space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Orden #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(order, e)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                        title="Eliminar orden"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cliente:</span>
                        <span className="text-sm font-medium text-gray-900 text-right">
                          {order.shippingAddress.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ubicación:
                        </span>
                        <span className="text-sm text-gray-900 text-right">
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Productos:
                        </span>
                        <span className="text-sm text-gray-900">
                          {order.items.length} producto
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        <span
                          className={`flex-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full text-center ${
                            PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                            order.paymentStatus}
                        </span>
                        <span
                          className={`flex-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full text-center ${
                            STATUS_COLORS[order.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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

      {/* Modal de Detalles de la Orden */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Orden #{selectedOrder.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Estados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Estado de Pago
                  </h3>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) =>
                      handlePaymentStatusChange(
                        selectedOrder.id,
                        e.target.value as PaymentStatus,
                      )
                    }
                    className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-gray-300 focus:border-[#2391C3] focus:outline-none"
                  >
                    <option value="pending">Pago pendiente</option>
                    <option value="approved">Pago aprobado</option>
                    <option value="rejected">Pago rechazado</option>
                    <option value="cancelled">Pago cancelado</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Cambiar a "Pago aprobado" para órdenes por WhatsApp
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Estado del Pedido
                  </h3>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedOrder.id,
                        e.target.value as OrderStatus,
                      )
                    }
                    className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-gray-300 focus:border-[#2391C3] focus:outline-none"
                    disabled={selectedOrder.paymentStatus !== "approved"}
                  >
                    <option value="pending">Pendiente de pago</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  {selectedOrder.paymentStatus !== "approved" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Solo se puede cambiar cuando el pago esté aprobado
                    </p>
                  )}
                </div>
              </div>

              {/* Dirección de Envío */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de Envío
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p className="font-semibold text-gray-800">
                    {selectedOrder.shippingAddress.fullName}
                  </p>
                  <p className="text-gray-700">
                    {selectedOrder.shippingAddress.street}
                  </p>
                  <p className="text-gray-700">
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.shippingAddress.phone}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Productos
                </h3>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-4 flex justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tela: {item.fabricName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          c/u: {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">
                    {formatPrice(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Envío:</span>
                  <span className="font-semibold">
                    {selectedOrder.shipping}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-gray-900">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Historial de Cambios */}
              <div className="border-t border-gray-200 pt-6">
                <OrderHistory
                  statusHistory={selectedOrder.statusHistory}
                  paymentStatusHistory={selectedOrder.paymentStatusHistory}
                />
              </div>

              {/* Botón de Eliminar */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={(e) => {
                    handleDelete(selectedOrder, e);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <TrashIcon className="h-5 w-5" />
                  Eliminar Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, order: null })}
        onConfirm={confirmDelete}
        title="Eliminar Orden"
        message={`¿Estás segura de eliminar la orden #${deleteDialog.order?.id.slice(0, 8)}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}
