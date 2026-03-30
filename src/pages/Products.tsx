import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import type { Product, Category } from "@/types";
import { getActiveProducts } from "@/services/products.service";
import { getAllCategories } from "@/services/categories.service";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import toast from "react-hot-toast";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadProducts();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => {
          // Soportar tanto el array categories como el campo category antiguo
          if (p.categories && p.categories.length > 0) {
            return p.categories.includes(selectedCategory);
          }
          return p.category === selectedCategory;
        });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div className="mb-6 sm:mb-8">
          <Breadcrumbs
            items={[{ label: "Inicio", href: "/" }, { label: "Productos" }]}
          />
          <h1
            className="text-3xl sm:text-4xl font-bold text-center mb-3 sm:mb-4"
            style={{ color: "#2391C3" }}
          >
            Nuestros Productos
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 text-sm sm:text-base">
            Descubre nuestra colección de productos herbales artesanales
          </p>
        </div>

        {/* Filtros por categoría */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 justify-start sm:justify-center">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
              selectedCategory === "all"
                ? "bg-[#2391C3] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                selectedCategory === cat.name
                  ? "bg-[#2391C3] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
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
