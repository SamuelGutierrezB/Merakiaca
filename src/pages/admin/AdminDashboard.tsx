import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8" style={{ color: "#2391C3" }}>
          Panel de Administración
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/admin/productos"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
          >
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">Productos</h2>
            <p className="text-gray-600">Gestionar catálogo de productos</p>
          </Link>

          <Link
            to="/admin/ordenes"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
          >
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">Órdenes</h2>
            <p className="text-gray-600">Ver y gestionar órdenes</p>
          </Link>

          <Link
            to="/admin/categorias"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
          >
            <div className="text-5xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold mb-2">Categorías</h2>
            <p className="text-gray-600">Gestionar categorías</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
