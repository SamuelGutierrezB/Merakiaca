import { useEffect } from "react";
import { AppRouter } from "@/routes/AppRouter";
import { useAuthStore } from "@/store/authStore";
import "./App.css";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Inicializar autenticación al montar la app
    initAuth();
  }, [initAuth]);

  return <AppRouter />;
}

export default App;
