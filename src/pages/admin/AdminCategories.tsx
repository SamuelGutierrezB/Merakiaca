import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Loader2, FolderTree } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminJoyride from "@/components/admin/AdminJoyride";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories.service";
import { getAllProducts } from "@/services/products.service";
import type { Category } from "@/types/category.types";

const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(1, "La descripción es requerida"),
  order: z.number().min(0, "El orden debe ser un número positivo"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    loadCategories();
    loadProductCounts();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  const loadProductCounts = async () => {
    try {
      const products = await getAllProducts();
      const counts: Record<string, number> = {};
      products.forEach((product) => {
        counts[product.category] = (counts[product.category] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (error) {
      console.error("Error loading product counts:", error);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    reset({
      name: "",
      description: "",
      order: categories.length,
    });
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description,
      order: category.order,
    });
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    const productCount = productCounts[category.name] || 0;

    if (productCount > 0) {
      toast.error(
        `No se puede eliminar. Hay ${productCount} producto(s) en esta categoría`,
      );
      return;
    }

    setDeleteDialog({ isOpen: true, category });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      await deleteCategory(deleteDialog.category.id);
      toast.success("Categoría eliminada exitosamente");
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Categoría actualizada exitosamente");
      } else {
        await createCategory(data);
        toast.success("Categoría creada exitosamente");
      }
      setShowForm(false);
      loadCategories();
      reset();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Error al guardar la categoría");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    reset();
  };

  if (showForm) {
    return (
      <>
        <AdminJoyride page="categories" />
        <div className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                    placeholder="Ej: Almohadas"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                    placeholder="Describe esta categoría..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de visualización *
                  </label>
                  <input
                    {...register("order", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                  />
                  {errors.order && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.order.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {editingCategory ? "Actualizar" : "Crear"} Categoría
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminJoyride page="categories" />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header con botón atrás */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-tour="categories-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">
                Volver al Panel de Administración
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1
                className="text-3xl font-bold text-gray-800"
                data-tour="categories-title"
              >
                Gestión de Categorías
              </h1>
              <p className="text-gray-600 mt-1">
                Organiza tus productos por categorías
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              data-tour="categories-create"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Nueva Categoría</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#2391C3] animate-spin" />
              <p className="text-gray-600">Cargando categorías...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FolderTree className="h-24 w-24 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No hay categorías todavía
              </h2>
              <p className="text-gray-600 mb-6">
                Crea tu primera categoría para organizar tus productos
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Crear Primera Categoría
              </button>
            </div>
          ) : (
            <>
              {/* Grid de categorías */}
              <div
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-tour="categories-list"
              >
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">
                        {productCounts[category.name] || 0} producto(s)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-[#2391C3] hover:text-[#1A6B8E] transition-colors p-2"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-[#E85D5D] hover:text-[#D7322D] transition-colors p-2"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Info card */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Sobre las Categorías
            </h3>
            <p className="text-blue-800 text-sm">
              Las categorías te ayudan a organizar tus productos. Los clientes
              pueden filtrar el catálogo por estas categorías para encontrar más
              fácilmente lo que buscan.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás segura de eliminar la categoría "${deleteDialog.category?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}
