import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  FolderTree,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AdminJoyride from "@/components/admin/AdminJoyride";
import {
  getDashboardStats,
  getRevenueByMonth,
  getTopProducts,
  getOrdersByStatus,
} from "@/services/stats.service";
import { formatPrice } from "@/utils/formatters";
import type {
  DashboardStats,
  RevenueByMonth,
  TopProduct,
  OrdersByStatus,
} from "@/services/stats.service";
import toast from "react-hot-toast";
import { useThemeStore } from "@/store/themeStore";

const STATUS_COLORS = ["#2391C3", "#8A4A86", "#D7322D", "#4CAF50", "#FF9800"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function AdminDashboard() {
  const isDark = useThemeStore((state) => state.isDark);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueByMonth[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, revenue, products, orders] = await Promise.all([
        getDashboardStats(),
        getRevenueByMonth(6),
        getTopProducts(5),
        getOrdersByStatus(),
      ]);

      setStats(statsData);
      setRevenueData(revenue);
      setTopProducts(products);
      setOrdersByStatus(orders);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-[#2391C3] animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminJoyride page="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div data-tour="dashboard-welcome" className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: "#2391C3" }}
          >
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bienvenida Madre, gestiona tu tienda desde aquí
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Accesos Rápidos
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              to="/admin/productos"
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
              data-tour="dashboard-products"
            >
              <Package className="h-20 w-20 mx-auto mb-4 text-[#2391C3]" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Productos
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gestionar catálogo de productos
              </p>
            </Link>

            <Link
              to="/admin/ordenes"
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
              data-tour="dashboard-orders"
            >
              <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-[#E85D5D]" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Órdenes
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Ver y gestionar órdenes
              </p>
            </Link>

            <Link
              to="/admin/categorias"
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
              data-tour="dashboard-categories"
            >
              <FolderTree className="h-20 w-20 mx-auto mb-4 text-[#8A4A86]" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Categorías
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gestionar categorías
              </p>
            </Link>

            <Link
              to="/admin/codigos-frecuentes"
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
            >
              <svg
                className="h-20 w-20 mx-auto mb-4 text-[#FFB800]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Códigos
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gestionar códigos de clientes frecuentes
              </p>
            </Link>

            <Link
              to="/admin/codigos-descuento"
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#2391C3]"
            >
              <svg
                className="h-20 w-20 mx-auto mb-4 text-[#4CAF50]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3-1.343-3-3m6 0c0 1.657-1.343 3-3 3m0 0v13m0-13a3 3 0 013 3v2a3 3 0 003 3h2a3 3 0 013 3m-14 0H5a3 3 0 01-3-3m0 0a3 3 0 013-3h2a3 3 0 003-3v-2a3 3 0 013-3"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Descuentos
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gestionar códigos de descuento para checkout
              </p>
            </Link>
          </div>
        </div>

        {/* Tarjetas de métricas principales */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900 border-l-4 border-[#2391C3]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Ingresos Totales
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-[#2391C3] opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Órdenes Pagadas
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {stats.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="h-12 w-12 text-green-500 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Órdenes Pendientes
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {stats.pendingOrders}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-500 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900 border-l-4 border-[#8A4A86]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Órdenes Entregadas
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {stats.completedOrders}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-[#8A4A86] opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfica de ingresos por mes */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#2391C3]" />
              Ingresos de los Últimos 6 Meses
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#374151" : "#d1d5db"}
                />
                <XAxis
                  dataKey="month"
                  stroke={isDark ? "#d1d5db" : "#4b5563"}
                  tick={{ fill: isDark ? "#d1d5db" : "#4b5563" }}
                />
                <YAxis
                  stroke={isDark ? "#d1d5db" : "#4b5563"}
                  tick={{ fill: isDark ? "#d1d5db" : "#4b5563" }}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value ? formatPrice(value) : "$0"
                  }
                  contentStyle={{
                    backgroundColor: isDark ? "#111827" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    color: isDark ? "#f3f4f6" : "#111827",
                  }}
                  labelStyle={{ color: isDark ? "#f3f4f6" : "#000" }}
                />
                <Legend
                  wrapperStyle={{ color: isDark ? "#d1d5db" : "#4b5563" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2391C3"
                  strokeWidth={2}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de órdenes por estado */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Órdenes por Estado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) =>
                    STATUS_LABELS[entry.status] || entry.status
                  }
                >
                  {ordersByStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#111827" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    color: isDark ? "#f3f4f6" : "#111827",
                  }}
                  labelStyle={{ color: isDark ? "#f3f4f6" : "#000" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Top 5 Productos Más Vendidos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#374151" : "#d1d5db"}
              />
              <XAxis
                dataKey="productName"
                stroke={isDark ? "#d1d5db" : "#4b5563"}
                tick={{ fill: isDark ? "#d1d5db" : "#4b5563" }}
              />
              <YAxis
                stroke={isDark ? "#d1d5db" : "#4b5563"}
                tick={{ fill: isDark ? "#d1d5db" : "#4b5563" }}
              />
              <Tooltip
                formatter={(
                  value: number | undefined,
                  name: string | undefined,
                ) =>
                  value ? (name === "revenue" ? formatPrice(value) : value) : 0
                }
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#ffffff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  color: isDark ? "#f3f4f6" : "#111827",
                }}
                labelStyle={{ color: isDark ? "#f3f4f6" : "#000" }}
              />
              <Legend
                wrapperStyle={{ color: isDark ? "#d1d5db" : "#4b5563" }}
              />
              <Bar dataKey="sales" fill="#2391C3" name="Unidades Vendidas" />
              <Bar dataKey="revenue" fill="#8A4A86" name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
