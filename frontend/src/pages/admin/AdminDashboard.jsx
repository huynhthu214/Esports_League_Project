// src/pages/admin/AdminDashboard.jsx - (THÚY VI)
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  const actions = [
    {
      to: "/admin/season",
      icon: "📅",
      label: "Tạo mùa giải",
      desc: "Khởi tạo mùa giải mới",
    },
    {
      to: "/admin/roster",
      icon: "👥",
      label: "Đăng ký Roster",
      desc: "Đăng ký đội tuyển vào mùa",
    },
    {
      to: "/admin/transfer",
      icon: "🔄",
      label: "Chuyển nhượng",
      desc: "Atomic SQL Transaction",
    },
    {
      to: "/admin/match",
      icon: "🎮",
      label: "Nhập kết quả trận",
      desc: "Dual-write SQL + MongoDB",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">
        Admin Dashboard
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Xin chào, <strong>{user?.username}</strong> — Ban tổ chức
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-xl">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="font-medium text-gray-800 text-sm">{a.label}</div>
            <div className="text-xs text-gray-400 mt-1">{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
