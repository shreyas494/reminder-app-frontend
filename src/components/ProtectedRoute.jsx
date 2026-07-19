import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or loader

  if (!user) {
    const isLogout = localStorage.getItem("logout_reason") === "logout" || localStorage.getItem("logout_reason") === "expired";
    return <Navigate to={isLogout ? "/login" : "/landing"} replace />;
  }

  return children;
}
