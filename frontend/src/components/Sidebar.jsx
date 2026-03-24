import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Sidebar = () => {
  const { user, isAdmin, isAnalyst } = useAuth();

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
      isActive
        ? "bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        : "text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
    }`;

  return (
    <aside className="w-64 min-h-screen bg-slate-900/60 backdrop-blur-xl border-r border-slate-800 p-5 flex flex-col gap-8 shadow-[10px_0_30px_rgba(0,0,0,0.3)] font-sans">
      
      {/* Public — tất cả đều thấy */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
          Tổng quan
        </p>
        <div className="flex flex-col gap-1.5">
          <NavLink to="/" className={linkClass} end>
            <span className="text-lg">🏠</span> Trang chủ
          </NavLink>
          <NavLink to="/leaderboard/players" className={linkClass} end>
            <span className="text-lg">🏆</span> Bảng xếp hạng
          </NavLink>
          <NavLink to="/standings" className={linkClass} end>
            <span className="text-lg">📊</span> Xếp hạng đội
          </NavLink>
        </div>
      </div>

      {/* Analyst / Coach / Admin */}
      {isAnalyst && (
        <div>
          <p className="text-xs font-bold text-purple-500/70 uppercase tracking-widest mb-3 px-2">
            Phân tích
          </p>
          <div className="flex flex-col gap-1.5">
            <NavLink to="/analyst" className={linkClass} end>
              <span className="text-lg">📈</span> Dashboard
            </NavLink>
            <NavLink to="/analyst/form" className={linkClass} end>
              <span className="text-lg">📉</span> Phong độ tuyển thủ
            </NavLink>
            <NavLink to="/analyst/compare" className={linkClass} end>
              <span className="text-lg">⚖️</span> So sánh tuyển thủ
            </NavLink>
            <NavLink to="/analyst/h2h" className={linkClass} end>
              <span className="text-lg">🔁</span> Lịch sử đối đầu
            </NavLink>
            <NavLink to="/analyst/meta" className={linkClass} end>
              <span className="text-lg">🧠</span> Meta tướng
            </NavLink>
          </div>
        </div>
      )}

      {/* Chỉ Admin */}
      {isAdmin && (
        <div>
          <p className="text-xs font-bold text-red-500/70 uppercase tracking-widest mb-3 px-2">
            Ban tổ chức
          </p>
          <div className="flex flex-col gap-1.5">
            <NavLink to="/admin" className={linkClass} end>
              <span className="text-lg">🛠️</span> Admin Dashboard
            </NavLink>
            <NavLink to="/admin/season" className={linkClass} end>
              <span className="text-lg">📅</span> Tạo mùa giải
            </NavLink>
            <NavLink to="/admin/roster" className={linkClass} end>
              <span className="text-lg">👥</span> Đăng ký Roster
            </NavLink>
            <NavLink to="/admin/roster-view" className={linkClass} end>
              <span className="text-lg">👁️</span> Xem Roster
            </NavLink>
            <NavLink to="/admin/transfer" className={linkClass} end>
              <span className="text-lg">🔄</span> Chuyển nhượng
            </NavLink>
            <NavLink to="/admin/match" className={linkClass} end>
              <span className="text-lg">🎮</span> Nhập kết quả
            </NavLink>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
