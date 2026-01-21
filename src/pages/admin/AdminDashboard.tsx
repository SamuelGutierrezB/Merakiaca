import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, FolderTree } from "lucide-react";
import AdminJoyride from "@/components/admin/AdminJoyride";

export default function AdminDashboard() {
  return (
    <Layout>
      <AdminJoyride page="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div data-tour="dashboard-welcome">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#2391C3" }}>
            Panel de Administración
          </h1>
          <p className="text-gray-600 mb-8">
            Bienvenida Madre, gestiona tu tienda desde aquí
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/admin/productos"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
            data-tour="dashboard-products"
          >
            <Package className="h-20 w-20 mx-auto mb-4 text-[#2391C3]" />
            <h2 className="text-2xl font-bold mb-2">Productos</h2>
            <p className="text-gray-600">Gestionar catálogo de productos</p>
          </Link>

          <Link
            to="/admin/ordenes"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
            data-tour="dashboard-orders"
          >
            <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-[#D7322D]" />
            <h2 className="text-2xl font-bold mb-2">Órdenes</h2>
            <p className="text-gray-600">Ver y gestionar órdenes</p>
          </Link>

          <Link
            to="/admin/categorias"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
            data-tour="dashboard-categories"
          >
            <FolderTree className="h-20 w-20 mx-auto mb-4 text-[#8A4A86]" />
            <h2 className="text-2xl font-bold mb-2">Categorías</h2>
            <p className="text-gray-600">Gestionar categorías</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
