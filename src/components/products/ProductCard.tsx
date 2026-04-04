import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/utils/formatters";
import { isBaseColor } from "@/utils/fabricColors";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const isFavorite = isInWishlist(product.id);
  const hasStock = product.fabrics.some((f) => f.stock > 0);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleWishlist(user.uid, product.id);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900 overflow-hidden hover:shadow-xl transition-shadow relative"
    >
      {/* Imagen */}
      <div className="relative bg-gray-100 dark:bg-gray-700 aspect-square overflow-hidden">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            Sin imagen
          </div>
        )}

        {/* Botón de favorito */}
        {user && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
            aria-label={
              isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600 dark:text-gray-300 hover:text-red-500"
              }`}
            />
          </button>
        )}

        {!hasStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-50 dark:bg-red-900/300 text-white px-4 py-2 rounded-lg font-semibold">
              Agotado
            </span>
          </div>
        )}

        {/* Opciones de color en círculos */}
        {product.fabrics.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            {product.fabrics.slice(0, 4).map((fabric) => {
              const isBase = isBaseColor(fabric.imageUrl);
              const hasImage =
                fabric.imageUrl && fabric.imageUrl.startsWith("http");
              return (
                <div
                  key={fabric.id}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-bold"
                  style={{
                    backgroundColor: isBase
                      ? fabric.imageUrl
                      : hasImage
                        ? "transparent"
                        : "#9CA3AF",
                    backgroundImage: hasImage
                      ? `url(${fabric.imageUrl})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  title={fabric.name}
                >
                  {!isBase && !hasImage && (
                    <span className="text-white">
                      {fabric.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
            {product.fabrics.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 bg-opacity-70 border-2 border-white dark:border-gray-600 shadow-md flex items-center justify-center text-[10px] text-white font-bold">
                +{product.fabrics.length - 4}
              </div>
            )}
          </div>
        )}
        {/* Botón de editar para admin */}
        {isAdmin && isAdmin() && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/admin/productos/editar/${product.id}`);
            }}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-[#2391C3] text-white shadow-md flex items-center justify-center hover:bg-[#1A6B8E] transition-colors z-20"
            title="Editar producto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V17h4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Información */}
      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 group-hover:text-[#2391C3] transition-colors line-clamp-2">
          {product.name}
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {product.description !== "sin descripcion"
            ? product.description
            : null}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(product.basePrice)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 justify-end">
            {(product.categories && product.categories.length > 0
              ? product.categories
              : [product.category]
            ).map((cat, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-[#E8DFCA] dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
