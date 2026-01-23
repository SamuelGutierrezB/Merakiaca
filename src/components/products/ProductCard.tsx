import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { formatPrice } from "@/utils/formatters";
import { isBaseColor } from "@/utils/fabricColors";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasStock = product.fabrics.some((f) => f.stock > 0);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
    >
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

        {!hasStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
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
              <div className="w-6 h-6 rounded-full bg-gray-800 bg-opacity-70 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
                +{product.fabrics.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-semibold text-sm sm:text-base text-gray-800 group-hover:text-[#2391C3] transition-colors line-clamp-2">
          {product.name}
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xl sm:text-2xl font-bold text-[#D7322D]">
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
                className="px-2 py-1 bg-[#E8DFCA] text-gray-800 rounded-full text-xs font-semibold"
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
