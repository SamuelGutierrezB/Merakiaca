export const APP_NAME = "Merakiaca";

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/productos",
  PRODUCT_DETAIL: "/producto/:id",
  CART: "/carrito",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: "/orden/:id",
  ORDER_SUCCESS: "/orden/success",
  ORDER_FAILURE: "/orden/failure",
  ORDER_PENDING: "/orden/pending",
  MY_ORDERS: "/mis-ordenes",
  WISHLIST: "/favoritos",
  LOGIN: "/login",
  ADMIN: {
    DASHBOARD: "/admin",
    PRODUCTS: "/admin/productos",
    ORDERS: "/admin/ordenes",
    CATEGORIES: "/admin/categorias",
    FREQUENT_CODES: "/admin/codigos-frecuentes",
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
  FREQUENT_CUSTOMER_CODES: "frequentCustomerCodes",
};

export const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(",") || [];
export const PRIMARY_ADMIN_EMAIL =
  import.meta.env.VITE_PRIMARY_ADMIN_EMAIL?.trim().toLowerCase() ||
  ADMIN_EMAILS[0]?.trim().toLowerCase() ||
  "";

export const TAX_RATE = 0.16; // 16% IVA
export const SHIPPING_COST = 99; // Costo de envío fijo
