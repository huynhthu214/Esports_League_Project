// src/components/ProtectedRoute.jsx - (THÚY VI) Chặn người chưa đăng nhập
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Dùng trong App.jsx:
// <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

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
