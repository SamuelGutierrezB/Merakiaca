import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import type { Product } from "@/types";
import { getActiveProducts } from "@/services/products.service";
import ProductCard from "@/components/products/ProductCard";
import toast from "react-hot-toast";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getActiveProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const categories = [
    { value: "all", label: "Todos" },
    { value: "cojines", label: "Cojines" },
    { value: "almohadas", label: "Almohadas" },
    { value: "terapeuticos", label: "Terapéuticos" },
    { value: "aromaterapia", label: "Aromaterapia" },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold text-center mb-3 sm:mb-4"
            style={{ color: "#2391C3" }}
          >
            Nuestros Productos
          </h1>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
            Descubre nuestra colección de productos herbales artesanales
          </p>
        </div>

        {/* Filtros por categoría */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 justify-start sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                selectedCategory === cat.value
                  ? "bg-[#2391C3] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No hay productos disponibles en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
