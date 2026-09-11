import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Layout from "@/components/layout/Layout";
import { updateOrderPaymentStatus } from "@/services/orders.service";
import {
  createMercadoPagoPreference,
  syncMercadoPagoPaymentStatus,
} from "@/services/mercadopago.service";
import { getResultMessage, type ResultType } from "@/utils/orderResultMessage";

const ICON: Record<ResultType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-20 w-20 text-green-500" />,
  failure: <XCircleIcon className="h-20 w-20 text-red-500" />,
  pending: <ClockIcon className="h-20 w-20 text-yellow-500" />,
};

const BG: Record<ResultType, string> = {
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  failure: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  pending: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
};

export default function OrderResult() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

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

    const syncPayment = async () => {
      try {
        if (collectionId) {
          let attempts = 0;

          while (attempts < 3) {
            attempts += 1;
            const result = await syncMercadoPagoPaymentStatus(
              externalReference,
              collectionId,
            );

            if (result.paymentStatus !== "pending" || attempts === 3) {
              return;
            }

            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }

          return;
        }

        const s = collectionStatus?.toLowerCase();
        const paymentStatus =
          s === "approved"
            ? ("approved" as const)
            : s === "rejected" || s === "cancelled"
              ? ("rejected" as const)
              : ("pending" as const);

        await updateOrderPaymentStatus(
          externalReference,
          paymentStatus,
          collectionId ?? undefined,
        );
      } catch (err) {
        console.error("Error actualizando estado de pago:", err);
      } finally {
        setProcessed(true);
      }
    };

    void syncPayment();
  }, [externalReference, collectionId, collectionStatus, processed]);

  const { title, description } = getResultMessage(
    pathType,
    Boolean(externalReference),
  );

  const handleGoToOrders = () => navigate("/mis-ordenes");
  const handleGoToCart = () => navigate("/carrito");

  const handleRetryPayment = async () => {
    if (!externalReference || retryingPayment) return;

    try {
      setRetryingPayment(true);
      const preference = await createMercadoPagoPreference(externalReference);
      window.location.href = preference.initPoint;
    } catch (err) {
      console.error("Error al reintentar pago:", err);
      navigate("/checkout");
    } finally {
      setRetryingPayment(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div
          className={`border rounded-2xl p-8 sm:p-12 ${BG[pathType]} flex flex-col items-center gap-4`}
        >
          {ICON[pathType]}

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h1>

          <p className="text-gray-600 dark:text-gray-300">{description}</p>

          {collectionId && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
                  onClick={handleRetryPayment}
                  disabled={!externalReference || retryingPayment}
                  className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {retryingPayment
                    ? "Redirigiendo..."
                    : "Intentar pago nuevamente"}
                </button>
                <button
                  onClick={handleGoToOrders}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
                >
                  Ver mis pedidos
                </button>
                <button
                  onClick={handleGoToCart}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
                >
                  Volver al carrito
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
