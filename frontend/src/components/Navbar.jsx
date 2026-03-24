import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const roleBadgeColor = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
  ANALYST: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
  COACH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
  FAN: "bg-slate-700/50 text-slate-300 border-slate-600",
};

const Navbar = () => {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] font-sans">
      {/* Logo */}
      <Link
        to="/"
        className="text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase flex items-center gap-2"
      >
        <span className="text-2xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">⚔️</span> NEXUS
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {isLoggedIn && user ? (
          <>
            <div className="flex items-center gap-3 bg-slate-950/50 py-1.5 px-3 rounded-full border border-slate-800">
              <span className="text-sm font-bold text-slate-200">{user.username}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${roleBadgeColor[user.role] || ""}`}
              >
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-400 hover:text-red-400 transition-colors duration-200"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;