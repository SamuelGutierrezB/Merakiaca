import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { getProductById } from "@/services/products.service";
import { formatPrice } from "@/utils/formatters";
import type { Product } from "@/types";
import toast from "react-hot-toast";

export default function Wishlist() {
  const { user } = useAuthStore();
  const { loadWishlist, removeFromWishlist } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserWishlist = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Primero cargamos la lista de IDs del servidor
      await loadWishlist(user.uid);

      // Luego obtenemos el wishlist actualizado del store
      const currentWishlist = useWishlistStore.getState().wishlist;

      if (currentWishlist.length === 0) {
        setProducts([]);
        return;
      }

      // Cargar detalles de los productos
      const productPromises = currentWishlist.map((productId) =>
        getProductById(productId),
      );
      const productsData = await Promise.all(productPromises);
      setProducts(productsData.filter((p) => p !== null) as Product[]);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      toast.error("Error al cargar favoritos");
    } finally {
      setLoading(false);
    }
  }, [user, loadWishlist]);

  useEffect(() => {
    if (user) {
      loadUserWishlist();
    }
  }, [user, loadUserWishlist]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    await removeFromWishlist(user.uid, productId);
    setProducts(products.filter((p) => p.id !== productId));
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Heart className="h-24 w-24 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Mis Favoritos
          </h1>
          <p className="text-gray-600 mb-8">
            Debes iniciar sesión para ver tus productos favoritos
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: "#2391C3" }}
          >
            Mis Favoritos
          </h1>
          <p className="text-gray-600">
            {products.length === 0
              ? "Aún no tienes productos favoritos"
              : `${products.length} producto${products.length !== 1 ? "s" : ""} guardado${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#2391C3] animate-spin" />
            <p className="text-gray-600">Cargando favoritos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Heart className="h-24 w-24 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No tienes favoritos todavía
            </h2>
            <p className="text-gray-600 mb-6">
              Explora nuestros productos y agrega tus favoritos haciendo clic en
              el corazón
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <Link to={`/producto/${product.id}`} className="block relative">
                  {/* Imagen */}
                  <div className="relative bg-gray-100 aspect-square overflow-hidden">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Sin imagen
                      </div>
                    )}

                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(product.id);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
                      aria-label="Quitar de favoritos"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </button>
                  </div>
                </Link>

                {/* Información */}
                <div className="p-4 space-y-2">
                  <Link
                    to={`/producto/${product.id}`}
                    className="block hover:text-[#2391C3] transition-colors"
                  >
                    <h3 className="font-semibold text-base text-gray-800 line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-bold text-[#D7322D]">
                      {formatPrice(product.basePrice)}
                    </span>

                    <Link
                      to={`/producto/${product.id}`}
                      className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                    >
                      Ver Detalles
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {(product.categories && product.categories.length > 0
                      ? product.categories
                      : [product.category]
                    ).map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[#E8DFCA] text-gray-800 rounded-full text-xs font-semibold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
