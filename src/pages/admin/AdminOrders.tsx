import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  Loader2,
  Package,
  MapPin,
  Phone,
  ShoppingBag,
  Copy,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import AdminJoyride from "@/components/admin/AdminJoyride";
import { Dialog, Transition } from "@headlessui/react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import OrderHistory from "@/components/common/OrderHistory";
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  deleteAllOrders,
} from "@/services/orders.service";
import { deleteOrder } from "@/services/orders.service";
import { formatPrice } from "@/utils/formatters";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order.types";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Fragment } from "react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
  pending:
    "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
  processing:
    "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
  shipped: "bg-purple-100 text-purple-800",
  delivered:
    "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
  cancelled: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  approved:
    "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
  rejected: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
  cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100",
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({ isOpen: false, order: null });
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState("");

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

  const closeDeleteAllDialog = () => {
    setDeleteAllDialogOpen(false);
    setDeleteAllConfirmation("");
  };

  const confirmDeleteAll = async () => {
    if (deleteAllConfirmation !== "eliminar") {
      return;
    }

    try {
      setDeletingAll(true);
      const deletedCount = await deleteAllOrders();
      setOrders([]);
      setSelectedOrder(null);
      closeDeleteAllDialog();
      toast.success(
        deletedCount > 0
          ? `Se eliminaron ${deletedCount} órdenes`
          : "No había órdenes para eliminar",
      );
    } catch (error) {
      console.error("Error deleting all orders:", error);
      toast.error("Error al eliminar todas las órdenes");
    } finally {
      setDeletingAll(false);
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

  const buildWhatsAppLink = (order: Order) => {
    const phone = order.shippingAddress.phone.replace(/\D/g, "");
    const name = order.shippingAddress.fullName.split(" ")[0];
    const statusLabel = STATUS_LABELS[order.status] || order.status;
    const paymentLabel =
      PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus;
    const text = `Hola ${name}! 👋 Te escribimos de *Meraki aca®* sobre tu pedido *#${order.id.slice(0, 8)}*.\n\n📦 Estado: ${statusLabel}\n💳 Pago: ${paymentLabel}\n💰 Total: ${formatPrice(order.total)}\n\n¿Tienes alguna duda?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const copyAddress = async (order: Order) => {
    const a = order.shippingAddress;
    const isPickup = !a.street || a.street.trim() === "";
    const text = isPickup
      ? `${a.fullName}\nRecolección en sucursal\nTel: ${a.phone}`
      : `${a.fullName}\n${a.street}\n${a.city}, ${a.state} ${a.zipCode}\nTel: ${a.phone}`;
    await navigator.clipboard.writeText(text);
    toast.success("Dirección copiada al portapapeles");
  };

  const buildMercadoPagoActivityUrl = (paymentId: string) => {
    return `https://www.mercadopago.com.mx/activities?search=${encodeURIComponent(paymentId)}`;
  };

  const copyPaymentId = async (paymentId: string) => {
    await navigator.clipboard.writeText(paymentId);
    toast.success("ID de pago copiado");
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
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 transition-colors"
              data-tour="orders-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">
                Volver al Panel de Administración
              </span>
            </button>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                className="text-3xl font-bold text-gray-800 dark:text-gray-100"
                data-tour="orders-title"
              >
                Gestión de Órdenes
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Administra los pedidos de tus clientes
              </p>
            </div>

            {orders.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteAllDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 dark:bg-red-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 dark:hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || deletingAll}
              >
                <TrashIcon className="h-5 w-5" />
                Borrar Todas las Órdenes
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#2391C3] animate-spin" />
              <p className="text-gray-600 dark:text-gray-300">
                Cargando órdenes...
              </p>
            </div>
          ) : orders.length === 0 ? (
            /* Estado vacío */
            <div
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center"
              data-tour="orders-empty"
            >
              <Package className="h-24 w-24 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                No hay órdenes todavía
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
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
                className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
                data-tour="orders-table"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Orden
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Productos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              #{order.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {order.shippingAddress.fullName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {order.items.length} producto
                              {order.items.length !== 1 ? "s" : ""}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {formatPrice(order.total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${
                                  PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                                  "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                }`}
                              >
                                {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                                  order.paymentStatus}
                              </span>
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${
                                  STATUS_COLORS[order.status] ||
                                  "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                }`}
                              >
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <a
                                href={buildWhatsAppLink(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-600 hover:text-green-800 dark:text-green-200 transition-colors"
                                title="Contactar por WhatsApp"
                              >
                                <WhatsAppIcon className="h-5 w-5" />
                              </a>
                              <button
                                onClick={(e) => handleDelete(order, e)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar orden"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
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
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Orden #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={buildWhatsAppLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800 dark:text-green-200 transition-colors p-1"
                          title="Contactar por WhatsApp"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </a>
                        <button
                          onClick={(e) => handleDelete(order, e)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Eliminar orden"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Cliente:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                          {order.shippingAddress.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Ubicación:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Productos:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {order.items.length} producto
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Total:
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <span
                          className={`flex-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full text-center ${
                            PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                            "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                            order.paymentStatus}
                        </span>
                        <span
                          className={`flex-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full text-center ${
                            STATUS_COLORS[order.status] ||
                            "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
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
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Sobre las Órdenes
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
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
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Orden #{selectedOrder.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Estados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">
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
                    className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-gray-300 dark:border-gray-600 focus:border-[#2391C3] focus:outline-none"
                  >
                    <option value="pending">Pago pendiente</option>
                    <option value="approved">Pago aprobado</option>
                    <option value="rejected">Pago rechazado</option>
                    <option value="cancelled">Pago cancelado</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                    Cambiar a "Pago aprobado" para órdenes por WhatsApp
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">
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
                    className="px-3 py-1 text-xs font-semibold rounded-full border-2 border-gray-300 dark:border-gray-600 focus:border-[#2391C3] focus:outline-none"
                    disabled={selectedOrder.paymentStatus !== "approved"}
                  >
                    <option value="pending">Pendiente de pago</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  {selectedOrder.paymentStatus !== "approved" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                      Solo se puede cambiar cuando el pago esté aprobado
                    </p>
                  )}
                </div>
              </div>

              {/* Dirección de Envío */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de Envío
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {selectedOrder.shippingAddress.fullName}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    {selectedOrder.shippingAddress.street}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.shippingAddress.phone}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Productos
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg divide-y divide-gray-200">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-4 flex justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Tela: {item.fabricName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          c/u: {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-200">
                    Subtotal:
                  </span>
                  <span className="font-semibold">
                    {formatPrice(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-200">
                    Envío:
                  </span>
                  <span className="font-semibold">
                    {selectedOrder.shipping}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    Total:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Historial de Cambios */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <OrderHistory
                  statusHistory={selectedOrder.statusHistory}
                  paymentStatusHistory={selectedOrder.paymentStatusHistory}
                />
              </div>

              {/* Acciones Rápidas */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={buildWhatsAppLink(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp al cliente
                  </a>
                  <button
                    onClick={() => copyAddress(selectedOrder)}
                    className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar dirección
                  </button>
                  {selectedOrder.paymentStatus === "pending" && (
                    <button
                      onClick={() =>
                        handlePaymentStatusChange(selectedOrder.id, "approved")
                      }
                      className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprobar pago
                    </button>
                  )}
                  {selectedOrder.mercadoPagoPaymentId && (
                    <>
                      <a
                        href={buildMercadoPagoActivityUrl(
                          selectedOrder.mercadoPagoPaymentId,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buscar pago en Mercado Pago
                      </a>
                      <button
                        onClick={() =>
                          copyPaymentId(selectedOrder.mercadoPagoPaymentId!)
                        }
                        className="col-span-2 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar ID de pago
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Botón de Eliminar */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={(e) => {
                    handleDelete(selectedOrder, e);
                  }}
                  className="w-full bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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

      <Transition appear show={deleteAllDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={closeDeleteAllDialog}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                    Borrar Todas las Órdenes
                  </Dialog.Title>

                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Esta acción eliminará permanentemente todas las órdenes.
                      Para continuar, selecciona la opción de eliminación y
                      luego confirma.
                    </p>

                    <div>
                      <label
                        htmlFor="delete-all-orders-select"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        Confirmación
                      </label>
                      <select
                        id="delete-all-orders-select"
                        value={deleteAllConfirmation}
                        onChange={(e) =>
                          setDeleteAllConfirmation(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="eliminar">Eliminar</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800"
                      onClick={closeDeleteAllDialog}
                      disabled={deletingAll}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={confirmDeleteAll}
                      disabled={
                        deleteAllConfirmation !== "eliminar" || deletingAll
                      }
                    >
                      {deletingAll ? "Eliminando..." : "Eliminar Todas"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
