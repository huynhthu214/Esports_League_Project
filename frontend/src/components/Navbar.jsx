// src/components/Navbar.jsx - (THÚY VI)
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const roleBadgeColor = {
  ADMIN: "bg-red-100 text-red-700",
  ANALYST: "bg-blue-100 text-blue-700",
  COACH: "bg-green-100 text-green-700",
  FAN: "bg-gray-100 text-gray-600",
};

const Navbar = () => {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg font-semibold text-gray-800 tracking-tight"
      >
        ⚔️ Esports League
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <span className="text-sm text-gray-500">{user.username}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user.role] || ""}`}
            >
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
