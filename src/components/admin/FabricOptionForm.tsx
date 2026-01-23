import { useState, useRef, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { FabricOption } from "@/types";
import { BASE_FABRIC_COLORS, generateFabricId } from "@/utils/fabricColors";
import ImageUpload from "@/components/common/ImageUpload";

interface FabricOptionFormProps {
  productId: string;
  fabrics: FabricOption[];
  onFabricsUpdate: (fabrics: FabricOption[]) => void;
}

export default function FabricOptionForm({
  productId,
  fabrics,
  onFabricsUpdate,
}: FabricOptionFormProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState(0);
  const [customStock, setCustomStock] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [optionType, setOptionType] = useState<"image" | "color">("color");
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const customFormRef = useRef<HTMLDivElement>(null);

  // Hacer scroll cuando se abre el formulario de nueva tela
  useEffect(() => {
    if (isAddingCustom && customFormRef.current) {
      setTimeout(() => {
        customFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isAddingCustom]);

  // Inicializar con colores base si no hay telas
  const ensureBaseFabrics = () => {
    if (fabrics.length === 0) {
      const baseFabrics: FabricOption[] = BASE_FABRIC_COLORS.map((base) => ({
        ...base,
        id: generateFabricId(),
        stock: 0,
      }));
      onFabricsUpdate(baseFabrics);
    }
  };

  const handleStockChange = (fabricId: string, newStock: number) => {
    const updated = fabrics.map((fabric) =>
      fabric.id === fabricId ? { ...fabric, stock: newStock } : fabric,
    );
    onFabricsUpdate(updated);
  };

  const handlePriceChange = (fabricId: string, newPrice: number) => {
    const updated = fabrics.map((fabric) =>
      fabric.id === fabricId ? { ...fabric, priceModifier: newPrice } : fabric,
    );
    onFabricsUpdate(updated);
  };

  const handleAddCustomFabric = () => {
    if (!customName.trim()) {
      toast.error("Ingresa un nombre para la tela");
      return;
    }

    if (optionType === "image" && !customImageUrl) {
      toast.error("Sube una imagen del patrón");
      return;
    }

    const newFabric: FabricOption = {
      id: generateFabricId(),
      name: customName,
      imageUrl: optionType === "color" ? selectedColor : customImageUrl,
      priceModifier: customPrice,
      stock: customStock,
    };

    onFabricsUpdate([...fabrics, newFabric]);

    // Resetear formulario
    setCustomName("");
    setCustomPrice(0);
    setCustomStock(0);
    setCustomImageUrl("");
    setSelectedColor("#FF6B6B");
    setOptionType("color");
    setIsAddingCustom(false);
    toast.success("Tela agregada");
  };

  const handleRemoveCustomFabric = (fabricId: string) => {
    const fabric = fabrics.find((f) => f.id === fabricId);

    // No permitir eliminar colores base
    if (fabric && fabric.imageUrl.startsWith("#")) {
      toast.error("No puedes eliminar los colores base");
      return;
    }

    onFabricsUpdate(fabrics.filter((f) => f.id !== fabricId));
    toast.success("Tela eliminada");
  };

  const handleCustomImageUploaded = (imageUrl: string) => {
    setCustomImageUrl(imageUrl);
  };

  // Asegurar colores base al montar
  if (fabrics.length === 0) {
    ensureBaseFabrics();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Opciones de Tela
        </h3>
        <button
          type="button"
          onClick={() => setIsAddingCustom(!isAddingCustom)}
          className="flex items-center gap-2 text-sm bg-[#8A4A86] hover:bg-[#6B3A66] text-white px-4 py-2 rounded-lg transition-colors"
          data-tour="form-add-fabric"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar Patrón/Color
        </button>
      </div>

      {/* Lista de opciones de tela */}
      <div className="space-y-4">
        {fabrics.map((fabric) => {
          const isBase = fabric.imageUrl.startsWith("#");

          return (
            <div
              key={fabric.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Preview del color/patrón */}
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex-shrink-0"
                style={{
                  backgroundColor: isBase ? fabric.imageUrl : "transparent",
                  backgroundImage: !isBase ? `url(${fabric.imageUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Información */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800">{fabric.name}</p>
                  {isBase && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Color base
                    </span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div className="w-24">
                <label className="text-xs text-gray-600">Stock</label>
                <input
                  type="number"
                  value={fabric.stock}
                  onChange={(e) =>
                    handleStockChange(fabric.id, parseInt(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Modificador de precio */}
              <div className="w-28">
                <label className="text-xs text-gray-600">Precio +/-</label>
                <input
                  type="number"
                  value={fabric.priceModifier}
                  onChange={(e) =>
                    handlePriceChange(
                      fabric.id,
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                  step="0.01"
                />
              </div>

              {/* Botón eliminar (solo para custom) */}
              {!isBase && (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomFabric(fabric.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Eliminar tela"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulario para agregar tela custom */}
      {isAddingCustom && (
        <div
          ref={customFormRef}
          className="p-6 bg-white border-2 border-dashed border-[#8A4A86] rounded-lg space-y-4"
        >
          <h4 className="font-semibold text-gray-800">
            Nueva Tela Personalizada
          </h4>

          {/* Tabs para elegir entre Color o Imagen */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setOptionType("color")}
              className={`px-4 py-2 font-medium transition-colors ${
                optionType === "color"
                  ? "text-[#8A4A86] border-b-2 border-[#8A4A86]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🎨 Color Sólido
            </button>
            <button
              type="button"
              onClick={() => setOptionType("image")}
              className={`px-4 py-2 font-medium transition-colors ${
                optionType === "image"
                  ? "text-[#8A4A86] border-b-2 border-[#8A4A86]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🖼️ Imagen/Patrón
            </button>
          </div>

          {/* Selector de color o imagen según el tipo */}
          {optionType === "color" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona un color *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="#FF6B6B"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Código hexadecimal del color
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ImageUpload
              productId={productId}
              onImageUploaded={handleCustomImageUploaded}
              label="Imagen del patrón"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la tela *
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej: Flores Vintage, Rayas Doradas, Azul Cielo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modificador de precio
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) =>
                  setCustomPrice(parseFloat(e.target.value) || 0)
                }
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto a sumar/restar al precio base
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock inicial
              </label>
              <input
                type="number"
                value={customStock}
                onChange={(e) => setCustomStock(parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddCustomFabric}
              className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Agregar Tela
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(false);
                setCustomName("");
                setCustomPrice(0);
                setCustomStock(0);
                setCustomImageUrl("");
                setSelectedColor("#FF6B6B");
                setOptionType("color");
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {fabrics.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No hay opciones de tela configuradas
        </p>
      )}
    </div>
  );
}
