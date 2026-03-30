import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { AdminRoute } from "./AdminRoute";
import { ROUTES } from "@/utils/constants";
import { ScrollToTop } from "@/components/common/ScrollToTop";

// Páginas - por ahora usaremos placeholders
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import MyOrders from "@/pages/MyOrders";
import Wishlist from "@/pages/Wishlist";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminFrequentCodes from "@/pages/admin/AdminFrequentCodes";
import DebugAuth from "@/pages/DebugAuth";
import AdminEditProduct from "@/pages/admin/AdminEditProduct";
import OrderResult from "@/pages/OrderResult";
import NotFound from "@/pages/NotFound";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Rutas públicas */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.PRODUCTS} element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/debug" element={<DebugAuth />} />
        <Route path={ROUTES.ORDER_SUCCESS} element={<OrderResult />} />
        <Route path={ROUTES.ORDER_FAILURE} element={<OrderResult />} />
        <Route path={ROUTES.ORDER_PENDING} element={<OrderResult />} />

        {/* Rutas privadas */}
        <Route
          path={ROUTES.CART}
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CHECKOUT}
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.MY_ORDERS}
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.WISHLIST}
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          }
        />

        {/* Rutas de administrador */}
        <Route
          path={ROUTES.ADMIN.DASHBOARD}
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.PRODUCTS}
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.ORDERS}
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.CATEGORIES}
          element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.FREQUENT_CODES}
          element={
            <AdminRoute>
              <AdminFrequentCodes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/productos/editar/:id"
          element={
            <AdminRoute>
              <AdminEditProduct />
            </AdminRoute>
          }
        />
        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
