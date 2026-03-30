import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Layout from "@/components/layout/Layout";
import { updateOrderPaymentStatus } from "@/services/orders.service";

type ResultType = "success" | "failure" | "pending";

const TITLE: Record<ResultType, string> = {
  success: "¡Pago exitoso!",
  failure: "Pago rechazado",
  pending: "Pago en proceso",
};

const DESCRIPTION: Record<ResultType, string> = {
  success:
    "Tu pedido ha sido confirmado. Pronto recibirás noticias por WhatsApp.",
  failure:
    "El pago no pudo completarse. Puedes intentarlo nuevamente desde tu carrito.",
  pending:
    "Tu pago está siendo procesado por Mercado Pago. Te avisaremos cuando se confirme.",
};

const ICON: Record<ResultType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-20 w-20 text-green-500" />,
  failure: <XCircleIcon className="h-20 w-20 text-red-500" />,
  pending: <ClockIcon className="h-20 w-20 text-yellow-500" />,
};

const BG: Record<ResultType, string> = {
  success: "bg-green-50 border-green-200",
  failure: "bg-red-50 border-red-200",
  pending: "bg-yellow-50 border-yellow-200",
};

export default function OrderResult() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);

  // Determinar tipo según la ruta
  const pathType: ResultType = location.pathname.includes("failure")
    ? "failure"
    : location.pathname.includes("pending")
      ? "pending"
      : "success";

  // Parámetros que envía Mercado Pago
  const collectionId =
    searchParams.get("collection_id") ?? searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference"); // orderId
  const collectionStatus =
    searchParams.get("collection_status") ?? searchParams.get("status");

  useEffect(() => {
    if (!externalReference || processed) return;

    const s = collectionStatus?.toLowerCase();
    const paymentStatus =
      s === "approved"
        ? ("approved" as const)
        : s === "rejected" || s === "cancelled"
          ? ("rejected" as const)
          : ("pending" as const);

    updateOrderPaymentStatus(
      externalReference,
      paymentStatus,
      collectionId ?? undefined,
    )
      .catch((err) => console.error("Error actualizando estado de pago:", err))
      .finally(() => setProcessed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalReference]);

  const handleGoToOrders = () => navigate("/mis-ordenes");
  const handleGoToCart = () => navigate("/carrito");

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div
          className={`border rounded-2xl p-8 sm:p-12 ${BG[pathType]} flex flex-col items-center gap-4`}
        >
          {ICON[pathType]}

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {TITLE[pathType]}
          </h1>

          <p className="text-gray-600">{DESCRIPTION[pathType]}</p>

          {collectionId && (
            <p className="text-xs text-gray-400 mt-1">
              Referencia MP: {collectionId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
            {pathType !== "failure" ? (
              <button
                onClick={handleGoToOrders}
                className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 rounded-lg transition-colors"
              >
                Ver mis pedidos
              </button>
            ) : (
              <>
                <button
                  onClick={handleGoToCart}
                  className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Volver al carrito
                </button>
                <button
                  onClick={handleGoToOrders}
                  className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ver mis pedidos
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
