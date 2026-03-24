import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center">
        {/* Vòng quay Loading Neon phong cách Cyberpunk */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        <p className="mt-6 text-cyan-400 font-bold tracking-widest animate-pulse uppercase text-sm">
          Đang xác thực hệ thống...
        </p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roleHierarchy = {
      ADMIN: ["ADMIN"],
      ANALYST: ["ADMIN", "ANALYST", "COACH"],
      FAN: ["ADMIN", "ANALYST", "COACH", "FAN"],
    };
    const allowed = roleHierarchy[requiredRole] || [requiredRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;