// ...existing code...
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
import { createMercadoPagoPreference } from "@/services/mercadopago.service";
import {
  validateDiscountCode,
  applyDiscountCode,
} from "@/services/discountCodes.service";
import type { AppliedDiscount } from "@/types";
import type { OrderItem, Address } from "@/types/order.types";
import BranchMap from "@/components/common/BranchMap";

// Bloqueado temporalmente el 2026-07-15: vulnerabilidad de manipulacion de
// precios en orders (ver PLAN_CODIGOS_DESCUENTO.md, seccion "Bloqueo temporal
// 2026-07-15"). Reactivar solo despues de validar precios server-side.
const DISCOUNT_CODES_ENABLED = false;

const pickupSchema = z.object({
  fullName: z
    .string()
    .min(3, "Ingresa tu nombre completo")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  whatsapp: z
    .string()
    .min(10, "El número debe tener al menos 10 dígitos")
    .max(15, "El número es demasiado largo")
    .regex(
      /^[0-9\s\-\+\(\)]+$/,
      "Solo números, espacios, guiones y paréntesis permitidos",
    )
    .transform((val) => val.replace(/[\s\-\(\)]/g, ""))
    .refine((val) => val.length >= 10, "Debe contener al menos 10 dígitos"),
  branchId: z.string().min(1, "Selecciona una sucursal"),
});

const addressSchema = z.object({
  fullName: z
    .string()
    .min(3, "Ingresa tu nombre completo")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  street: z
    .string()
    .min(5, "Ingresa tu dirección completa")
    .max(200, "La dirección es demasiado larga"),
  city: z
    .string()
    .min(2, "Ingresa tu ciudad")
    .max(50, "El nombre de la ciudad es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "La ciudad solo puede contener letras"),
  state: z
    .string()
    .min(2, "Ingresa tu estado")
    .max(50, "El nombre del estado es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El estado solo puede contener letras"),
  zipCode: z
    .string()
    .min(4, "El código postal debe tener al menos 4 dígitos")
    .max(10, "El código postal es demasiado largo")
    .regex(/^[0-9]+$/, "El código postal solo puede contener números"),
  country: z.string(),
  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El número es demasiado largo")
    .regex(
      /^[0-9\s\-\+\(\)]+$/,
      "Solo números, espacios, guiones y paréntesis permitidos",
    )
    .transform((val) => val.replace(/[\s\-\(\)]/g, ""))
    .refine((val) => val.length >= 10, "Debe contener al menos 10 dígitos"),
});

type PickupFormData = z.infer<typeof pickupSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

const SHIPPING_COSTS = {
  local: 150,
  foreign: 150,
} as const;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryType, setDeliveryType] = useState<
    "pickup" | "shippingLocal" | "shippingForeign"
  >("pickup");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscount | null>(null);

  const pickupForm = useForm<PickupFormData>({
    resolver: zodResolver(pickupSchema),
  });

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
  // Lógica de envío
  const shipping =
    deliveryType === "pickup"
      ? 0
      : deliveryType === "shippingLocal"
        ? SHIPPING_COSTS.local
        : SHIPPING_COSTS.foreign;
  const tax = 0; // Gratis por ahora
  const totalBeforeDiscount = subtotal + shipping + tax;
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  const handleApplyDiscount = async () => {
    const normalizedCode = discountCodeInput.trim().toUpperCase();

    if (!normalizedCode) {
      toast.error("Ingresa un codigo de descuento");
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const validatedDiscount = await validateDiscountCode(
        normalizedCode,
        subtotal,
      );
      setAppliedDiscount(validatedDiscount);
      setDiscountCodeInput(validatedDiscount.code);
      toast.success("Codigo aplicado correctamente");
    } catch (error) {
      setAppliedDiscount(null);
      toast.error(
        error instanceof Error ? error.message : "No se pudo aplicar el codigo",
      );
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput("");
    toast.success("Codigo removido");
  };

  const getFreshDiscountSnapshot =
    async (): Promise<AppliedDiscount | null> => {
      if (!appliedDiscount) {
        return null;
      }

      try {
        return await validateDiscountCode(appliedDiscount.code, subtotal);
      } catch {
        setAppliedDiscount(null);
        toast.error(
          "El codigo ya no es valido. Revisa el codigo o continua sin descuento.",
        );
        return null;
      }
    };

  const onSubmitPickup = async (data: PickupFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para continuar");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    try {
      const freshDiscount = await getFreshDiscountSnapshot();
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        fabricId: item.fabricId,
        fabricName: item.fabricName,
        quantity: item.quantity,
        unitPrice: item.priceAtAdd,
        totalPrice: item.priceAtAdd * item.quantity,
      }));

      // Para recolección en sucursal, usar datos mínimos
      const pickupAddress: Address = {
        fullName: data.fullName,
        street: `Recolección en sucursal - ${data.branchId}`,
        city: "Guadalajara",
        state: "Jalisco",
        zipCode: "00000",
        country: "México",
        phone: data.whatsapp,
      };

      const finalTotal = Math.max(
        0,
        subtotal + tax - (freshDiscount?.discountAmount || 0),
      );

      const orderId = await createOrder(user.uid, {
        items: orderItems,
        shippingAddress: pickupAddress,
        discountSnapshot: freshDiscount || undefined,
        subtotal,
        tax,
        shipping: 0,
        total: finalTotal,
      });

      if (freshDiscount) {
        try {
          await applyDiscountCode(
            orderId,
            freshDiscount.code,
            freshDiscount.discountAmount,
            finalTotal,
          );
        } catch (discountError) {
          console.error(
            "Error al aplicar descuento en transacción:",
            discountError,
          );
          toast.error("El descuento no pudo ser aplicado. Intenta nuevamente.");
          setIsProcessing(false);
          return;
        }
      }

      const preference = await createMercadoPagoPreference(orderId);

      clearCart();
      // Redirigir a Mercado Pago para completar el pago
      window.location.href = preference.initPoint;
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      toast.error("Error al procesar el pedido. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para continuar");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    try {
      const freshDiscount = await getFreshDiscountSnapshot();
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
      const finalTotal = Math.max(
        0,
        subtotal + shipping + tax - (freshDiscount?.discountAmount || 0),
      );

      const orderId = await createOrder(user.uid, {
        items: orderItems,
        shippingAddress: data as Address,
        discountSnapshot: freshDiscount || undefined,
        subtotal,
        tax,
        shipping,
        total: finalTotal,
      });

      if (freshDiscount) {
        try {
          await applyDiscountCode(
            orderId,
            freshDiscount.code,
            freshDiscount.discountAmount,
            finalTotal,
          );
        } catch (discountError) {
          console.error(
            "Error al aplicar descuento en transacción:",
            discountError,
          );
          toast.error("El descuento no pudo ser aplicado. Intenta nuevamente.");
          setIsProcessing(false);
          return;
        }
      }

      const preference = await createMercadoPagoPreference(orderId);

      // Limpiar el carrito
      clearCart();
      // Redirigir a Mercado Pago para completar el pago
      window.location.href = preference.initPoint;
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
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 sm:p-8">
              {/* Selector de tipo de entrega */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                  Método de Entrega
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === "pickup"
                        ? "border-[#2391C3] bg-[#2391C3]/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:border-gray-600"
                    }`}
                  >
                    <div className="text-4xl mb-2">📦</div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Recolección en Sucursal
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Entregas locales (Guadalajara) - Sin costo
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("shippingLocal")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === "shippingLocal"
                        ? "border-[#2391C3] bg-[#2391C3]/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:border-gray-600"
                    }`}
                  >
                    <div className="text-4xl mb-2">🚚</div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Envío Local a Domicilio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Zona metropolitana - {formatPrice(SHIPPING_COSTS.local)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("shippingForeign")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === "shippingForeign"
                        ? "border-[#2391C3] bg-[#2391C3]/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:border-gray-600"
                    }`}
                  >
                    <div className="text-4xl mb-2">📮</div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Envío Foráneo a Domicilio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Paquetería nacional -{" "}
                      {formatPrice(SHIPPING_COSTS.foreign)}
                    </p>
                  </button>
                </div>
              </div>

              {/* Formulario según tipo de entrega */}
              {deliveryType === "pickup" ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    Datos de Recolección
                  </h2>
                  <form
                    onSubmit={pickupForm.handleSubmit(onSubmitPickup)}
                    className="space-y-6"
                  >
                    {/* Nombre */}
                    <div>
                      <label
                        htmlFor="pickup-fullName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Nombre Completo *
                      </label>
                      <input
                        {...pickupForm.register("fullName")}
                        type="text"
                        id="pickup-fullName"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                        placeholder="Juan Pérez"
                      />
                      {pickupForm.formState.errors.fullName && (
                        <p className="text-red-600 text-sm mt-1">
                          {pickupForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label
                        htmlFor="pickup-whatsapp"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Número de WhatsApp *
                      </label>
                      <input
                        {...pickupForm.register("whatsapp")}
                        type="tel"
                        id="pickup-whatsapp"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                        placeholder="33 1234 5678"
                      />
                      {pickupForm.formState.errors.whatsapp && (
                        <p className="text-red-600 text-sm mt-1">
                          {pickupForm.formState.errors.whatsapp.message}
                        </p>
                      )}
                    </div>

                    {/* Mapa de sucursales */}
                    <div>
                      <input
                        type="hidden"
                        {...pickupForm.register("branchId")}
                        value={selectedBranch}
                      />
                      <BranchMap
                        selectedBranchId={selectedBranch}
                        onSelectBranch={(branchId) => {
                          setSelectedBranch(branchId);
                          pickupForm.setValue("branchId", branchId);
                        }}
                        showTitle={true}
                      />
                      {pickupForm.formState.errors.branchId && (
                        <p className="text-red-600 text-sm mt-2">
                          {pickupForm.formState.errors.branchId.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 sm:py-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-base sm:text-lg"
                    >
                      {isProcessing
                        ? "Creando orden..."
                        : "Pagar con Mercado Pago"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    Dirección de Envío
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nombre Completo */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Nombre Completo *
                      </label>
                      <input
                        {...register("fullName")}
                        type="text"
                        id="fullName"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Dirección *
                      </label>
                      <input
                        {...register("street")}
                        type="text"
                        id="street"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                        >
                          Ciudad *
                        </label>
                        <input
                          {...register("city")}
                          type="text"
                          id="city"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                        >
                          Estado *
                        </label>
                        <input
                          {...register("state")}
                          type="text"
                          id="state"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                        >
                          Código Postal *
                        </label>
                        <input
                          {...register("zipCode")}
                          type="text"
                          id="zipCode"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                        >
                          País *
                        </label>
                        <input
                          {...register("country")}
                          type="text"
                          id="country"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Teléfono *
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        id="phone"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
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
                      className="w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-3 sm:py-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-base sm:text-lg mt-6"
                    >
                      {isProcessing
                        ? "Creando orden..."
                        : "Pagar con Mercado Pago"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
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
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {item.fabricName} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {formatPrice(item.priceAtAdd * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtotales */}
              <div className="mb-4 border-b pb-4">
                <label
                  htmlFor="discountCode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Codigo de descuento
                </label>
                {DISCOUNT_CODES_ENABLED ? (
                  <div className="flex gap-2">
                    <input
                      id="discountCode"
                      type="text"
                      value={discountCodeInput}
                      onChange={(e) =>
                        setDiscountCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder="Ej: BIENVENIDA10"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                      disabled={isApplyingDiscount || isProcessing}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={isApplyingDiscount || isProcessing}
                      className="px-3 py-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white rounded-lg text-sm font-semibold disabled:bg-gray-400"
                    >
                      {isApplyingDiscount ? "Aplicando..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Los codigos de descuento estan temporalmente
                    deshabilitados por mantenimiento.
                  </p>
                )}

                {DISCOUNT_CODES_ENABLED && appliedDiscount && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Codigo aplicado: {appliedDiscount.code}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Descuento: {formatPrice(appliedDiscount.discountAmount)}
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Quitar codigo
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Subtotal:
                  </span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Envío:
                  </span>
                  <span className="font-semibold">
                    {deliveryType === "pickup" ? "$0" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Impuestos:
                  </span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Descuento ({appliedDiscount.code}):
                    </span>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Nota sobre envío */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {deliveryType === "pickup"
                    ? "Las entregas locales no tienen costo."
                    : deliveryType === "shippingLocal"
                      ? `El costo de envío local es de ${formatPrice(
                          SHIPPING_COSTS.local,
                        )}.`
                      : `El costo de envío foráneo es de ${formatPrice(
                          SHIPPING_COSTS.foreign,
                        )}.`}
                </p>
              </div>

              {/* Nota sobre pago */}
              {/* <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300"></p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
