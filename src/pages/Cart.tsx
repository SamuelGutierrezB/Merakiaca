import { Link } from "react-router-dom";
import { TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ShoppingCart } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/formatters";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } =
    useCartStore();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
          <h1
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: "#2391C3" }}
          >
            Carrito de Compras
          </h1>
          <p className="text-center text-gray-600 mb-8 sm:mb-12">
            Tu carrito está vacío
          </p>

          <div className="text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg">
            <ShoppingCart className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 text-gray-400" />
            <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
              Aún no has agregado productos a tu carrito
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-3 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg transition-colors shadow-lg"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#2391C3" }}
          >
            Carrito de Compras
          </h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <TrashIcon className="h-5 w-5" />
            Vaciar Carrito
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Lista de items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.fabricId}`}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6"
              >
                <div className="flex gap-4">
                  {/* Imagen */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Tela:{" "}
                      <span className="font-medium">{item.fabricName}</span>
                    </p>
                    <p className="text-base sm:text-lg font-bold text-[#D7322D] mb-3">
                      {formatPrice(item.priceAtAdd)}
                    </p>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.fabricId,
                              item.quantity - 1,
                            )
                          }
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <MinusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="px-4 py-2 font-semibold text-sm sm:text-base min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.fabricId,
                              item.quantity + 1,
                            )
                          }
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.productId, item.fabricId)
                        }
                        className="text-red-600 hover:text-red-700 p-2 transition-colors"
                        title="Eliminar del carrito"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal (solo desktop) */}
                  <div className="hidden sm:flex flex-col items-end justify-between">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatPrice(item.priceAtAdd * item.quantity)}
                    </p>
                  </div>
                </div>

                {/* Subtotal móvil */}
                <div className="sm:hidden flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-lg font-bold text-gray-800">
                    {formatPrice(item.priceAtAdd * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Resumen del Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {formatPrice(getTotal())}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío:</span>
                  <span className="font-semibold">A calcular</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#D7322D]">
                    {formatPrice(getTotal())}
                  </span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold py-4 rounded-lg transition-colors shadow-lg mb-3 text-center"
              >
                Proceder al Pago
              </Link>

              <Link
                to="/productos"
                className="block text-center text-[#2391C3] hover:text-[#1A6B8E] font-semibold transition-colors"
              >
                Seguir Comprando
              </Link>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  ✓ Envío gratis en compras mayores a $500
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
