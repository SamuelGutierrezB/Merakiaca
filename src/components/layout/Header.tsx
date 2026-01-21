import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import logo from "@/assets/logo.png";

export default function Header() {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Desktop & Mobile Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Mobile: Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-[#2391C3] p-2"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          {/* Logo - Centrado en móvil, izquierda en desktop */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 sm:relative sm:left-0 sm:translate-x-0"
          >
            <img
              src={logo}
              alt="Meraki ACA Logo"
              className="h-10 sm:h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              to="/"
              className="text-[#2391C3] hover:text-[#1A6B8E] font-semibold transition-colors"
            >
              Inicio
            </Link>
            <Link
              to="/productos"
              className="text-[#2391C3] hover:text-[#1A6B8E] font-semibold transition-colors"
            >
              Productos
            </Link>

            {user ? (
              <>
                <Link
                  to="/carrito"
                  className="relative text-[#2391C3] hover:text-[#1A6B8E] font-semibold transition-colors flex items-center gap-1"
                >
                  🛒 Carrito
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="bg-[#8A4A86] hover:bg-[#6A3A66] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    👨‍💼 Admin
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="h-10 w-10 rounded-full border-2 border-[#2391C3]"
                  />
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-red-600 font-semibold transition-colors"
                  >
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </nav>

          {/* Mobile: Cart Icon */}
          <Link to="/carrito" className="sm:hidden relative text-[#2391C3] p-2">
            <ShoppingCartIcon className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="flex flex-col py-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-[#2391C3] hover:bg-gray-50 font-semibold transition-colors"
            >
              Inicio
            </Link>
            <Link
              to="/productos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-[#2391C3] hover:bg-gray-50 font-semibold transition-colors"
            >
              Productos
            </Link>

            {user ? (
              <>
                <Link
                  to="/carrito"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-[#2391C3] hover:bg-gray-50 font-semibold transition-colors flex items-center justify-between"
                >
                  <span>🛒 Carrito</span>
                  {itemCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-[#8A4A86] hover:bg-gray-50 font-semibold transition-colors"
                  >
                    👨‍💼 Admin
                  </Link>
                )}

                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="h-10 w-10 rounded-full border-2 border-[#2391C3]"
                    />
                    <span className="text-gray-700 font-medium">
                      {user.displayName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-4 my-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-4 py-3 rounded-lg font-semibold transition-colors text-center"
              >
                Iniciar Sesión
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
