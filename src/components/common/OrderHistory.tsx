import { Clock, Package, CreditCard } from "lucide-react";
import type { StatusHistory, PaymentStatusHistory } from "@/types/order.types";

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

interface OrderHistoryProps {
  statusHistory?: StatusHistory[];
  paymentStatusHistory?: PaymentStatusHistory[];
}

export default function OrderHistory({
  statusHistory = [],
  paymentStatusHistory = [],
}: OrderHistoryProps) {
  // Combinar y ordenar todos los cambios por fecha
  const allHistory = [
    ...statusHistory.map((h) => ({ ...h, type: "status" as const })),
    ...paymentStatusHistory.map((h) => ({ ...h, type: "payment" as const })),
  ].sort((a, b) => {
    const timeA = a.changedAt.toMillis();
    const timeB = b.changedAt.toMillis();
    return timeB - timeA; // Más reciente primero
  });

  if (allHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No hay historial de cambios</p>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Historial de Cambios
      </h3>

      <div className="relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Lista de eventos */}
        <div className="space-y-4">
          {allHistory.map((item, index) => {
            const isStatus = item.type === "status";
            const label = isStatus
              ? STATUS_LABELS[(item as any).status]
              : PAYMENT_STATUS_LABELS[(item as any).paymentStatus];

            return (
              <div key={index} className="relative flex gap-4">
                {/* Icono del evento */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                    isStatus
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {isStatus ? (
                    <Package className="h-5 w-5" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                </div>

                {/* Contenido del evento */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="font-semibold text-gray-800">{label}</h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(item.changedAt)}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-sm text-gray-600 mb-2">{item.note}</p>
                  )}

                  {item.changedBy && (
                    <p className="text-xs text-gray-500">
                      Cambiado por administrador
                    </p>
                  )}

                  {!item.changedBy && !item.note && (
                    <p className="text-xs text-gray-500">
                      Cambio automático del sistema
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
