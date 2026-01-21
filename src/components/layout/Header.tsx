import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import logo from "@/assets/logo.png";

export default function Header() {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/">
          <img src={logo} alt="Meraki ACA Logo" className="h-16 w-auto" />
        </Link>

        <nav className="flex items-center gap-6">
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
          <a
            href="/catalogo.pdf"
            target="_blank"
            className="bg-[#D7322D] hover:bg-[#B32824] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            📄 Ver Catálogo
          </a>

          {user ? (
            <>
              <Link
                to="/carrito"
                className="relative text-[#2391C3] hover:text-[#1A6B8E] font-semibold transition-colors"
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
      </div>
    </header>
  );
}
