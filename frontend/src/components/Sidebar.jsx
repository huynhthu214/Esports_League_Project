// src/components/Sidebar.jsx - (THÚY VI) Menu bên trái, ẩn/hiện theo Role
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Sidebar = () => {
  const { user, isAdmin, isAnalyst } = useAuth();

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 p-4 flex flex-col gap-6">
      {/* Public — tất cả đều thấy */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Tổng quan
        </p>
        <NavLink to="/" className={linkClass} end>
          🏠 Trang chủ
        </NavLink>
        <NavLink to="/leaderboard/players" className={linkClass} end>
          🏆 Bảng xếp hạng
        </NavLink>
        <NavLink to="/standings" className={linkClass} end>
          📊 Xếp hạng đội
        </NavLink>
      </div>

      {/* Analyst / Coach / Admin */}
      {isAnalyst && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Phân tích
          </p>
          <NavLink to="/analyst" className={linkClass} end>
            📈 Dashboard
          </NavLink>
          <NavLink to="/analyst/form" className={linkClass} end>
            📉 Phong độ tuyển thủ
          </NavLink>
          <NavLink to="/analyst/compare" className={linkClass} end>
            ⚖️ So sánh tuyển thủ
          </NavLink>
          <NavLink to="/analyst/h2h" className={linkClass} end>
            🔁 Lịch sử đối đầu
          </NavLink>
          <NavLink to="/analyst/meta" className={linkClass} end>
            🧠 Meta tướng
          </NavLink>
        </div>
      )}

      {/* Chỉ Admin */}
      {isAdmin && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ban tổ chức
          </p>
          <NavLink to="/admin" className={linkClass} end>
            🛠️ Admin Dashboard
          </NavLink>
          <NavLink to="/admin/season" className={linkClass} end>
            📅 Tạo mùa giải
          </NavLink>
          <NavLink to="/admin/roster" className={linkClass} end>
            👥 Đăng ký Roster
          </NavLink>
          <NavLink to="/admin/roster-view" className={linkClass} end>
            👁️ Xem Roster
          </NavLink>
          <NavLink to="/admin/transfer" className={linkClass} end>
            🔄 Chuyển nhượng
          </NavLink>
          <NavLink to="/admin/match" className={linkClass} end>
            🎮 Nhập kết quả
          </NavLink>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
