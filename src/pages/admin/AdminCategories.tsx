import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminJoyride from "@/components/admin/AdminJoyride";

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories] = useState<Category[]>([
    {
      id: "1",
      name: "Cojines",
      description: "Cojines herbales artesanales",
      productCount: 0,
    },
    {
      id: "2",
      name: "Almohadas",
      description: "Almohadas terapéuticas",
      productCount: 0,
    },
    {
      id: "3",
      name: "Terapéuticos",
      description: "Productos de uso terapéutico",
      productCount: 0,
    },
    {
      id: "4",
      name: "Aromaterapia",
      description: "Productos con aromas naturales",
      productCount: 0,
    },
  ]);

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
              <span className="hidden sm:inline">Volver al Dashboard</span>
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
              onClick={() => toast.success("Función próximamente disponible")}
              className="flex items-center gap-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              data-tour="categories-create"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Nueva Categoría</span>
            </button>
          </div>

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
                  <div>
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
                    {category.productCount} productos
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toast.success("Función próximamente disponible")
                      }
                      className="text-[#2391C3] hover:text-[#1A6B8E] transition-colors p-2"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        toast.success(
                          "No se puede eliminar una categoría con productos",
                        )
                      }
                      className="text-[#D7322D] hover:text-[#B32824] transition-colors p-2"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
    </>
  );
}
