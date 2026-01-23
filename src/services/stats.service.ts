import { getAllOrders } from "./orders.service";
import { getAllProducts } from "./products.service";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  lowStockProducts: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  revenue: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productName: string;
  sales: number;
  revenue: number;
}

/**
 * Obtiene las estadísticas generales del dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [orders, products] = await Promise.all([
      getAllOrders(),
      getAllProducts(),
    ]);

    // Filtrar solo órdenes con pago aprobado
    const paidOrders = orders.filter((o) => o.paymentStatus === "approved");

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const pendingOrders = orders.filter(
      (o) => o.paymentStatus === "pending" || o.status === "pending",
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === "delivered",
    ).length;
    const averageOrderValue =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Productos con stock bajo (menos de 5 unidades)
    const lowStockProducts = products.filter((p) => {
      const totalStock =
        p.fabrics?.reduce((sum, f) => sum + (f.stock || 0), 0) || 0;
      return totalStock < 5 && totalStock > 0;
    }).length;

    return {
      totalOrders: paidOrders.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
      averageOrderValue,
      totalProducts: products.length,
      lowStockProducts,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de órdenes por estado
 */
export async function getOrdersByStatus(): Promise<OrdersByStatus[]> {
  try {
    const orders = await getAllOrders();
    const paidOrders = orders.filter((o) => o.paymentStatus === "approved");

    const statusMap = new Map<string, { count: number; revenue: number }>();

    paidOrders.forEach((order) => {
      const current = statusMap.get(order.status) || { count: 0, revenue: 0 };
      statusMap.set(order.status, {
        count: current.count + 1,
        revenue: current.revenue + order.total,
      });
    });

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
    }));
  } catch (error) {
    console.error("Error getting orders by status:", error);
    throw error;
  }
}

/**
 * Obtiene los ingresos de los últimos 6 meses
 */
export async function getRevenueByMonth(
  months: number = 6,
): Promise<RevenueByMonth[]> {
  try {
    const orders = await getAllOrders();
    const paidOrders = orders.filter((o) => o.paymentStatus === "approved");

    const result: RevenueByMonth[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, "MMM yyyy");

      const monthOrders = paidOrders.filter((order) => {
        const orderDate = order.createdAt.toDate();
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

      result.push({
        month: monthLabel,
        revenue,
        orders: monthOrders.length,
      });
    }

    return result;
  } catch (error) {
    console.error("Error getting revenue by month:", error);
    throw error;
  }
}

/**
 * Obtiene los productos más vendidos
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  try {
    const orders = await getAllOrders();
    const paidOrders = orders.filter((o) => o.paymentStatus === "approved");

    const productMap = new Map<string, { sales: number; revenue: number }>();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productMap.get(item.productName) || {
          sales: 0,
          revenue: 0,
        };
        productMap.set(item.productName, {
          sales: current.sales + item.quantity,
          revenue: current.revenue + item.totalPrice,
        });
      });
    });

    return Array.from(productMap.entries())
      .map(([productName, data]) => ({
        productName,
        sales: data.sales,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting top products:", error);
    throw error;
  }
}
