import { CheckIcon } from "@heroicons/react/24/solid";
import type { FabricOption } from "@/types";
import { isBaseColor } from "@/utils/fabricColors";
import { formatPrice } from "@/utils/formatters";

interface FabricSelectorProps {
  fabrics: FabricOption[];
  selectedFabricId?: string;
  onSelect: (fabric: FabricOption) => void;
  basePrice: number;
}

export default function FabricSelector({
  fabrics,
  selectedFabricId,
  onSelect,
  basePrice,
}: FabricSelectorProps) {
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Selecciona tu tela
        </h3>
        {selectedFabric && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">{selectedFabric.name}</span>
            {selectedFabric.priceModifier !== 0 && (
              <span className="ml-2 text-gray-900 dark:text-gray-100">
                ({selectedFabric.priceModifier > 0 ? "+" : ""}
                {formatPrice(selectedFabric.priceModifier)})
              </span>
            )}
          </p>
        )}
      </div>
      : "border-gray-300 dark:border-gray-600 hover:border-[#2391C3]"
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {fabrics.map((fabric) => {
          const isSelected = fabric.id === selectedFabricId;
          const isBase = isBaseColor(fabric.imageUrl);
          const isOutOfStock = fabric.stock === 0;
          const hasImage =
            fabric.imageUrl && fabric.imageUrl.startsWith("http");

          return (
            <button
              key={fabric.id}
              type="button"
              onClick={() => !isOutOfStock && onSelect(fabric)}
              disabled={isOutOfStock}
              className={`
                relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 transition-all
                ${
                  isSelected
                    ? "border-[#2391C3] ring-4 ring-[#2391C3] ring-opacity-30"
                    : "border-gray-300 dark:border-gray-600 hover:border-[#2391C3]"
                }
                ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
              title={`${fabric.name}${isOutOfStock ? " (Agotado)" : ""}`}
            >
              {/* Color/Patrón */}
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                style={{
                  backgroundColor: isBase
                    ? fabric.imageUrl
                    : hasImage
                      ? "transparent"
                      : "#CBD5E1",
                  backgroundImage: hasImage
                    ? `url(${fabric.imageUrl})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!isBase && !hasImage && (
                  <span className="text-gray-700 dark:text-gray-200">
                    {fabric.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Check si está seleccionado */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2391C3] bg-opacity-40 rounded-full">
                  <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              )}

              {/* X si está agotado */}
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 dark:bg-gray-700 bg-opacity-50 rounded-full">
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    ✕
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Precio final y stock */}
      {selectedFabric && (
        <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Precio final:
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(basePrice + selectedFabric.priceModifier)}
            </span>
          </div>

          {/* Stock disponible */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Stock disponible:
            </span>
            <span
              className={`text-sm font-semibold ${
                selectedFabric.stock === 0
                  ? "text-red-600"
                  : selectedFabric.stock < 10
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {selectedFabric.stock}{" "}
              {selectedFabric.stock === 1 ? "unidad" : "unidades"}
            </span>
          </div>
        </div>
      )}
      {fabrics.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
          No hay opciones de tela disponibles para este producto
        </p>
      )}
    </div>
  );
}
