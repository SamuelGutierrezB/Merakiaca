import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { updateOrderPaymentStatus } from "@/services/orders.service";
import toast from "react-hot-toast";

export default function PaymentSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  const orderId = searchParams.get("orderId");
  const total = searchParams.get("total");

  useEffect(() => {
    // Simular proceso de pago después de 3 segundos
    const timer = setTimeout(async () => {
      // 90% de probabilidad de éxito para la simulación
      const isSuccess = Math.random() > 0.1;
      const status = isSuccess ? "approved" : "rejected";
      setPaymentStatus(status);

      // Actualizar el estado de la orden en Firestore
      if (orderId) {
        try {
          await updateOrderPaymentStatus(
            orderId,
            status,
            `MP-SIM-${Date.now()}`, // ID simulado de Mercado Pago
          );
        } catch (error) {
          console.error("Error al actualizar estado de pago:", error);
          toast.error("Error al procesar el pago");
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    if (paymentStatus === "pending" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, paymentStatus]);

  useEffect(() => {
    // Redirigir después de mostrar el resultado
    if (paymentStatus !== "pending") {
      const redirectTimer = setTimeout(() => {
        if (paymentStatus === "approved") {
          navigate(`/mis-ordenes`);
        } else {
          navigate("/carrito");
        }
      }, 5000);

      return () => clearTimeout(redirectTimer);
    }
  }, [paymentStatus, navigate]);

  const handleRetry = () => {
    navigate("/carrito");
  };

  const handleViewOrders = () => {
    navigate("/mis-ordenes");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          {paymentStatus === "pending" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <ClockIcon className="h-20 w-20 text-[#2391C3] mx-auto animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Procesando pago...
              </h2>
              <p className="text-gray-600 mb-6">
                Estamos simulando la conexión con Mercado Pago
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  Orden: #{orderId?.slice(0, 8)}
                </p>
                <p className="text-2xl font-bold text-[#2391C3] mt-2">
                  ${total}
                </p>
              </div>
              <div className="flex justify-center items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#2391C3] border-t-transparent"></div>
                <span className="text-gray-500">Espera {countdown}s...</span>
              </div>
              <p className="text-xs text-gray-500 mt-6">
                🔧 Modo simulación: Este es un entorno de prueba
              </p>
            </div>
          )}

          {paymentStatus === "approved" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center animate-fade-in">
              <div className="mb-6">
                <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                ¡Pago Exitoso!
              </h2>
              <p className="text-gray-600 mb-6">
                Tu pedido ha sido confirmado y está siendo procesado
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Orden: #{orderId?.slice(0, 8)}
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ${total}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Recibirás un correo con los detalles de tu pedido
                </p>
              </div>
              <button
                onClick={handleViewOrders}
                className="w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-3"
              >
                Ver mis pedidos
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Volver al inicio
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Redirigiendo automáticamente en 5 segundos...
              </p>
            </div>
          )}

          {paymentStatus === "rejected" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center animate-fade-in">
              <div className="mb-6">
                <XCircleIcon className="h-20 w-20 text-red-500 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Pago Rechazado
              </h2>
              <p className="text-gray-600 mb-6">
                No se pudo procesar tu pago. Por favor, intenta nuevamente.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Orden: #{orderId?.slice(0, 8)}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  El pago fue rechazado por el procesador
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Verifica tus datos e intenta nuevamente
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-3"
              >
                Reintentar pago
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Redirigiendo al carrito en 5 segundos...
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
