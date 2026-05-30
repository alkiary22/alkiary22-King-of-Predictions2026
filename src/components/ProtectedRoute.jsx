import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false, staffOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-gold animate-pulse font-display text-xl">جاري التحميل…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  if (staffOnly && !["admin", "supervisor"].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
