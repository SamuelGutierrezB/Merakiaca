import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { getAllProducts, deleteProduct } from "@/services/products.service";
import ProductForm from "@/components/admin/ProductForm";
import { formatPrice } from "@/utils/formatters";
import AdminJoyride from "@/components/admin/AdminJoyride";

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    try {
      await deleteProduct(product.id);
      toast.success("Producto eliminado");
      loadProducts();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(undefined);
    loadProducts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  if (showForm) {
    return (
      <>
        <AdminJoyride page="product-form" />
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleFormCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-tour="form-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Volver a Productos</span>
            </button>
          </div>
          <h1
            className="text-3xl font-bold text-gray-800 mb-8"
            data-tour="form-title"
          >
            {editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
          </h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminJoyride page="products" />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Botón atrás */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-tour="products-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
            </button>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Gestión de Productos
            </h1>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              data-tour="products-create"
            >
              <PlusIcon className="h-5 w-5" />
              Crear Producto
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No hay productos aún</p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Crear tu primer producto
              </button>
            </div>
          ) : (
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              data-tour="products-table"
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Sin imagen
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#E8DFCA] text-gray-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.basePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (product.fabrics?.reduce(
                              (sum, f) => sum + (f.stock || 0),
                              0,
                            ) || 0) > 10
                              ? "bg-green-100 text-green-800"
                              : (product.fabrics?.reduce(
                                    (sum, f) => sum + (f.stock || 0),
                                    0,
                                  ) || 0) > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.fabrics?.reduce(
                            (sum, f) => sum + (f.stock || 0),
                            0,
                          ) || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div
                          className="flex justify-end gap-2"
                          data-tour="products-actions"
                        >
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-[#2391C3] hover:text-[#1A6B8E] transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-[#D7322D] hover:text-[#B32824] transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
