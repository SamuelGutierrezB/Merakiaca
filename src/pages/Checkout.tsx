import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Layout from "@/components/layout/Layout";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/utils/formatters";
import { createOrder } from "@/services/orders.service";
import type { OrderItem, Address } from "@/types/order.types";

const addressSchema = z.object({
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  street: z.string().min(5, "Ingresa tu dirección completa"),
  city: z.string().min(2, "Ingresa tu ciudad"),
  state: z.string().min(2, "Ingresa tu estado"),
  zipCode: z.string().min(4, "Ingresa tu código postal"),
  country: z.string(),
  phone: z.string().min(10, "Ingresa un teléfono válido"),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "México",
    },
  });

  // Si no hay items, redirigir al carrito
  if (items.length === 0) {
    navigate("/carrito");
    return null;
  }

  const subtotal = getTotal();
  const shipping = 0; // A calcular después
  const tax = 0; // Gratis por ahora
  const total = subtotal + shipping + tax;

  const onSubmit = async (data: AddressFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para continuar");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    try {
      // Convertir items del carrito a OrderItem
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        fabricId: item.fabricId,
        fabricName: item.fabricName,
        quantity: item.quantity,
        unitPrice: item.priceAtAdd,
        totalPrice: item.priceAtAdd * item.quantity,
      }));

      // Crear la orden
      await createOrder(user.uid, {
        items: orderItems,
        shippingAddress: data as Address,
        subtotal,
        tax,
        shipping,
        total,
      });

      // Limpiar el carrito
      clearCart();

      // Mostrar mensaje de éxito
      toast.success("¡Pedido realizado con éxito!");

      // Redirigir a página de confirmación
      navigate("/");
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      toast.error("Error al procesar el pedido. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8"
          style={{ color: "#2391C3" }}
        >
          Finalizar Pedido
        </h1>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Formulario de dirección */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">
                Dirección de Envío
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nombre Completo */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    {...register("fullName")}
                    type="text"
                    id="fullName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                    placeholder="Juan Pérez"
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Calle */}
                <div>
                  <label
                    htmlFor="street"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dirección *
                  </label>
                  <input
                    {...register("street")}
                    type="text"
                    id="street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                    placeholder="Calle, número, colonia"
                  />
                  {errors.street && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.street.message}
                    </p>
                  )}
                </div>

                {/* Ciudad y Estado */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ciudad *
                    </label>
                    <input
                      {...register("city")}
                      type="text"
                      id="city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                      placeholder="Guadalajara"
                    />
                    {errors.city && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Estado *
                    </label>
                    <input
                      {...register("state")}
                      type="text"
                      id="state"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                      placeholder="Jalisco"
                    />
                    {errors.state && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Código Postal y País */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="zipCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Código Postal *
                    </label>
                    <input
                      {...register("zipCode")}
                      type="text"
                      id="zipCode"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                      placeholder="44100"
                    />
                    {errors.zipCode && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      País *
                    </label>
                    <input
                      {...register("country")}
                      type="text"
                      id="country"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Teléfono *
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                    placeholder="33 1234 5678"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Botón Submit */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 sm:py-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg mt-6"
                >
                  {isProcessing ? "Procesando..." : "Confirmar Pedido"}
                </button>
              </form>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Resumen del Pedido
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 border-b pb-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.fabricId}`}
                    className="flex justify-between text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.fabricName} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatPrice(item.priceAtAdd * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtotales */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-semibold text-gray-500 italic">
                    A calcular
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos:</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-[#D7322D]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Nota sobre envío */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  💡 El costo de envío se calculará y confirmará por WhatsApp
                  después de realizar el pedido.
                </p>
              </div>

              {/* Nota sobre pago */}
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  ✨ Promoción especial: <strong>Envío gratuito</strong> en tu
                  primer pedido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
