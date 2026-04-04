import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "@/services/products.service";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/types";
import Layout from "@/components/layout/Layout";

export default function AdminEditProduct() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    if (id === "nuevo") {
      setProduct(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    getProductById(id)
      .then((data) => {
        if (!data) {
          navigate("/admin/productos");
          return;
        }
        setProduct(data);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (typeof product === "undefined" && id !== "nuevo") {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Producto no encontrado
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {id === "nuevo" ? "Crear Nuevo Producto" : "Editar producto"}
        </h2>
        <ProductForm
          product={id === "nuevo" ? undefined : product}
          onSuccess={() => navigate("/admin/productos")}
          onCancel={() => navigate("/admin/productos")}
        />
      </div>
    </Layout>
  );
}
