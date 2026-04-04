import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { getActiveProducts } from "@/services/products.service";
import type { Product } from "@/types";

export default function NotFound() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    getActiveProducts()
      .then((data) => setFeatured(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        {/* Ilustración 404 */}
        <div className="mb-8">
          <p className="text-[10rem] font-black leading-none text-[#2391C3] opacity-20 select-none">
            404
          </p>
          <div className="-mt-12 relative z-10">
            <span className="text-6xl">🧵</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          ¡Ups! Esta página se perdió en el tejido
        </h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          La página que buscas no existe o fue movida. Pero no te preocupes,
          tenemos muchos productos herbales que te van a encantar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/"
            className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors shadow-lg"
          >
            Ir al Inicio
          </Link>
          <Link
            to="/productos"
            className="border-2 border-[#2391C3] text-[#2391C3] hover:bg-[#2391C3] hover:text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors"
          >
            Ver Productos
          </Link>
        </div>

        {featured.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6">
              Productos destacados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
