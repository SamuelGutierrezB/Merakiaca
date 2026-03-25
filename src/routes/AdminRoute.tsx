import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, initialized, isAdmin } = useAuthStore();

  console.log("AdminRoute: user:", user);
  console.log("AdminRoute: isAdmin():", isAdmin());
  console.log("AdminRoute: loading:", loading);
  console.log("AdminRoute: initialized:", initialized);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
