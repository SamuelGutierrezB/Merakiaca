import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Layout from "@/components/layout/Layout";
import type { Product, FabricOption } from "@/types";
import { getProductById } from "@/services/products.service";
import FabricSelector from "@/components/products/FabricSelector";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/formatters";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFabric, setSelectedFabric] = useState<
    FabricOption | undefined
  >();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!id) {
      navigate("/products");
      return;
    }

    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getProductById(id);

      if (!data) {
        toast.error("Producto no encontrado");
        navigate("/products");
        return;
      }

      setProduct(data);

      // Seleccionar la primera tela disponible por defecto
      if (data.fabrics.length > 0) {
        const firstAvailable = data.fabrics.find((f) => f.stock > 0);
        setSelectedFabric(firstAvailable || data.fabrics[0]);
      }
    } catch (error) {
      console.error("Error al cargar producto:", error);
      toast.error("Error al cargar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedFabric) {
      toast.error("Selecciona una opción de tela");
      return;
    }

    if (selectedFabric.stock === 0) {
      toast.error("Esta tela está agotada");
      return;
    }

    if (quantity > selectedFabric.stock) {
      toast.error(`Solo hay ${selectedFabric.stock} unidades disponibles`);
      return;
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.mainImage || "",
      fabricId: selectedFabric.id,
      fabricName: selectedFabric.name,
      quantity,
      priceAtAdd: product.basePrice + selectedFabric.priceModifier,
    });

    toast.success("Producto agregado al carrito");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500">Producto no encontrado</p>
        </div>
      </Layout>
    );
  }

  const isBaseColor = (imageUrl: string) => imageUrl.startsWith("#");
  const hasImage =
    selectedFabric?.imageUrl && selectedFabric.imageUrl.startsWith("http");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Imagen del producto */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
              {product.mainImage ? (
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>
          </div>

          {/* Información y Opciones */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-[#E8DFCA] text-gray-800 rounded-full text-sm font-semibold">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-bold text-[#D7322D]">
              {formatPrice(product.basePrice)}
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-600 text-sm sm:text-base">
                {product.description}
              </p>
            </div>

            {/* Selector de tela con vista previa */}
            {product.fabrics.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Vista previa de tela - más pequeña */}
                  <div className="w-full sm:w-48 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Vista previa
                    </h3>
                    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden aspect-square relative">
                      <div
                        className="w-full h-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            selectedFabric &&
                            isBaseColor(selectedFabric.imageUrl)
                              ? selectedFabric.imageUrl
                              : hasImage
                                ? "transparent"
                                : "#F3F4F6",
                          backgroundImage: hasImage
                            ? `url(${selectedFabric.imageUrl})`
                            : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {!selectedFabric && (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center px-2">
                            Selecciona una tela
                          </div>
                        )}
                        {selectedFabric &&
                          !isBaseColor(selectedFabric.imageUrl) &&
                          !hasImage && (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-5xl text-gray-400 font-bold">
                                {selectedFabric.name.charAt(0)}
                              </span>
                            </div>
                          )}
                      </div>
                      {selectedFabric && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white font-semibold text-xs truncate">
                            {selectedFabric.name}
                          </p>
                          <p className="text-white/90 text-xs">
                            {formatPrice(
                              product.basePrice + selectedFabric.priceModifier,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selector de telas */}
                  <div className="flex-1">
                    <FabricSelector
                      fabrics={product.fabrics}
                      selectedFabricId={selectedFabric?.id}
                      onSelect={setSelectedFabric}
                      basePrice={product.basePrice}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                max={selectedFabric?.stock || product.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
              />
            </div>

            {/* Botón agregar al carrito */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedFabric || selectedFabric.stock === 0}
              className="w-full flex items-center justify-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {selectedFabric && selectedFabric.stock === 0
                ? "Agotado"
                : "Agregar al Carrito"}
            </button>

            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
              <p>✓ Envío gratis en compras mayores a $500</p>
              <p>✓ Garantía de satisfacción</p>
              <p>✓ Productos 100% naturales</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
