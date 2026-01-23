import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import toast from "react-hot-toast";
import type { Product, ProductFormData, FabricOption, Category } from "@/types";
import { productSchema } from "@/utils/validators";
import { FIREBASE_COLLECTIONS } from "@/utils/constants";
import {
  createProduct,
  updateProduct,
  updateProductMainImage,
  updateProductFabrics,
  addProductImages,
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
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    product?.images || [],
  );
  const [fabrics, setFabrics] = useState<FabricOption[]>(
    product?.fabrics || [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories || product?.category ? [product.category] : [],
  );
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
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          category: product.category,
          categories: product.categories || [product.category],
          isActive: product.isActive,
        }
      : {
          name: "",
          description: "",
          basePrice: 0,
          category: "",
          categories: [],
          isActive: true,
        },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Preparar datos con categorías
      const productData = {
        ...data,
        categories: selectedCategories,
        category: selectedCategories[0] || "", // Mantener la primera como principal por compatibilidad
      };

      if (isEditing && productId) {
        await updateProduct(productId, productData);
        toast.success("Producto actualizado exitosamente");
      } else {
        const newProductId = await createProduct(productData);
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

  const handleAdditionalImageUploaded = async (imageUrl: string) => {
    const updatedImages = [...additionalImages, imageUrl];
    setAdditionalImages(updatedImages);

    // Si el producto ya existe, actualizar inmediatamente
    if (productId) {
      try {
        await addProductImages(productId, [imageUrl]);
        toast.success("Imagen agregada a la galería");
      } catch (error) {
        console.error("Error al agregar imagen:", error);
        toast.error("Error al agregar la imagen");
      }
    }
  };

  const handleRemoveAdditionalImage = async (index: number) => {
    if (!productId) {
      // Si no existe el producto, solo actualizar estado local
      setAdditionalImages(additionalImages.filter((_, i) => i !== index));
      return;
    }

    try {
      const updatedImages = additionalImages.filter((_, i) => i !== index);
      setAdditionalImages(updatedImages);

      const productRef = doc(db, FIREBASE_COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      toast.success("Imagen eliminada");
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Imagen principal */}
      <div data-tour="form-image">
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

      {/* Galería de imágenes adicionales */}
      {productId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Galería de imágenes adicionales
          </label>

          {/* Imágenes existentes */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {additionalImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    src={imageUrl}
                    alt={`Imagen adicional ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalImage(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar imagen"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subir nueva imagen adicional */}
          <ImageUpload
            productId={productId}
            onImageUploaded={handleAdditionalImageUploaded}
            label="Agregar imagen a la galería"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Puedes agregar múltiples imágenes para mostrar el producto desde
            diferentes ángulos
          </p>
        </div>
      )}

      {!productId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Primero crea el producto con la imagen
            principal, luego podrás agregar más imágenes a la galería.
          </p>
        </div>
      )}

      <div data-tour="form-name">
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

      <div data-tour="form-description">
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

      <div data-tour="form-price">
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

      <div data-tour="form-category">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorías *
        </label>
        <Controller
          name="categories"
          control={control}
          render={() => (
            <div className="space-y-2 p-4 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay categorías.{" "}
                  <a
                    href="/admin/categorias"
                    className="text-[#2391C3] hover:underline"
                  >
                    Crear una categoría
                  </a>
                </p>
              ) : (
                categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([
                            ...selectedCategories,
                            cat.name,
                          ]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== cat.name),
                          );
                        }
                      }}
                      className="h-4 w-4 text-[#2391C3] focus:ring-[#2391C3] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        />
        {selectedCategories.length === 0 && (
          <p className="text-red-500 text-sm mt-1">
            Selecciona al menos una categoría
          </p>
        )}
        {selectedCategories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#2391C3] text-white text-sm rounded-full"
              >
                {cat}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategories(
                      selectedCategories.filter((c) => c !== cat),
                    )
                  }
                  className="hover:bg-[#1A6B8E] rounded-full p-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center" data-tour="form-active">
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
        <div className="pt-6 border-t border-gray-200" data-tour="form-fabrics">
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
          data-tour="form-submit"
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
