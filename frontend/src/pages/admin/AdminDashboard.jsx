import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  const actions = [
    { to: "/admin/season", icon: "📅", label: "Tạo mùa giải", desc: "Khởi tạo mùa giải mới" },
    { to: "/admin/roster", icon: "👥", label: "Đăng ký Roster", desc: "Đăng ký đội tuyển vào mùa" },
    { to: "/admin/transfer", icon: "🔄", label: "Chuyển nhượng", desc: "Atomic SQL Transaction" },
    { to: "/admin/match", icon: "🎮", label: "Nhập kết quả trận", desc: "Dual-write SQL + MongoDB" },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-10 border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-2">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Xin chào, <strong className="text-red-400">{user?.username}</strong> — Khu vực Ban tổ chức giải đấu.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all transform hover:-translate-y-1 flex flex-col"
            >
              <div className="text-4xl mb-4">{a.icon}</div>
              <div className="font-bold text-slate-200 text-lg mb-1">{a.label}</div>
              <div className="text-xs text-slate-500 font-medium">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;