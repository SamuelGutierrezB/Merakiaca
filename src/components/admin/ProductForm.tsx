import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { Product, ProductFormData, FabricOption, Category } from "@/types";
import { productSchema } from "@/utils/validators";
import {
  createProduct,
  updateProduct,
  updateProductMainImage,
  updateProductFabrics,
} from "@/services/products.service";
import { getAllCategories } from "@/services/categories.service";
import ImageUpload from "@/components/common/ImageUpload";
import FabricOptionForm from "@/components/admin/FabricOptionForm";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState(product?.id);
  const [mainImageUrl, setMainImageUrl] = useState(product?.mainImage || "");
  const [fabrics, setFabrics] = useState<FabricOption[]>(
    product?.fabrics || [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!product;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          stock: product.stock,
          category: product.category,
          isActive: product.isActive,
        }
      : {
          name: "",
          description: "",
          basePrice: 0,
          stock: 0,
          category: "",
          isActive: true,
        },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && productId) {
        await updateProduct(productId, data);
        toast.success("Producto actualizado exitosamente");
      } else {
        const newProductId = await createProduct(data);
        setProductId(newProductId);
        toast.success("Producto creado exitosamente");

        // Si ya hay imagen, actualizarla
        if (mainImageUrl) {
          await updateProductMainImage(newProductId, mainImageUrl);
        }
      }
      onSuccess();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setMainImageUrl(imageUrl);

    // Si el producto ya existe, actualizar inmediatamente
    if (productId) {
      try {
        await updateProductMainImage(productId, imageUrl);
        toast.success("Imagen actualizada");
      } catch (error) {
        console.error("Error al actualizar imagen:", error);
        toast.error("Error al actualizar la imagen");
      }
    }
  };

  const handleFabricsUpdate = async (updatedFabrics: FabricOption[]) => {
    setFabrics(updatedFabrics);

    // Si el producto ya existe, actualizar inmediatamente
    if (productId) {
      try {
        await updateProductFabrics(productId, updatedFabrics);
      } catch (error) {
        console.error("Error al actualizar opciones de tela:", error);
        toast.error("Error al actualizar las opciones de tela");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Imagen principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagen principal del producto
        </label>

        {/* Preview de imagen actual */}
        {mainImageUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Imagen actual:</p>
            <div className="w-full max-w-md bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={mainImageUrl}
                alt="Imagen del producto"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        )}

        {/* Subir nueva imagen */}
        <ImageUpload
          productId={productId}
          onImageUploaded={handleImageUploaded}
          label={mainImageUrl ? "Cambiar imagen" : "Subir imagen"}
        />
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nombre del producto *
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
          placeholder="Ej: Cojín Herbal Relajante"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Descripción *
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
          placeholder="Describe tu producto..."
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="basePrice"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Precio base *
          </label>
          <input
            {...register("basePrice", { valueAsNumber: true })}
            type="number"
            step="0.01"
            id="basePrice"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
            placeholder="0.00"
          />
          {errors.basePrice && (
            <p className="text-red-500 text-sm mt-1">
              {errors.basePrice.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="stock"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Stock *
          </label>
          <input
            {...register("stock", { valueAsNumber: true })}
            type="number"
            id="stock"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
            placeholder="0"
          />
          {errors.stock && (
            <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Categoría *
        </label>
        <select
          {...register("category")}
          id="category"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
        )}
        {categories.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No hay categorías.{" "}
            <a
              href="/admin/categorias"
              className="text-[#2391C3] hover:underline"
            >
              Crear una categoría
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          {...register("isActive")}
          type="checkbox"
          id="isActive"
          className="h-4 w-4 text-[#2391C3] focus:ring-[#2391C3] border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Producto activo (visible para clientes)
        </label>
      </div>

      {/* Opciones de tela - Solo mostrar si el producto ya fue creado */}
      {productId && (
        <div className="pt-6 border-t border-gray-200">
          <FabricOptionForm
            productId={productId}
            fabrics={fabrics}
            onFabricsUpdate={handleFabricsUpdate}
          />
        </div>
      )}

      {!productId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Primero crea el producto, luego podrás
            agregar las opciones de tela y patrones.
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Actualizar Producto"
              : "Crear Producto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
