import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.some((role) => auth.user?.role === role)) {
    return <Navigate to={auth.isAdminArea ? "/admin" : "/user"} replace />;
  }

  return <>{children}</>;
}

