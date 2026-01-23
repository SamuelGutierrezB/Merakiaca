export const APP_NAME = "Merakiaca";

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/productos",
  PRODUCT_DETAIL: "/producto/:id",
  CART: "/carrito",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: "/orden/:id",
  MY_ORDERS: "/mis-ordenes",
  WISHLIST: "/favoritos",
  LOGIN: "/login",
  ADMIN: {
    DASHBOARD: "/admin",
    PRODUCTS: "/admin/productos",
    ORDERS: "/admin/ordenes",
    CATEGORIES: "/admin/categorias",
  },
};

export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  CARTS: "carts",
  ORDERS: "orders",
  REVIEWS: "reviews",
  WISHLISTS: "wishlists",
};

export const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(",") || [];

export const TAX_RATE = 0.16; // 16% IVA
export const SHIPPING_COST = 99; // Costo de envío fijo
