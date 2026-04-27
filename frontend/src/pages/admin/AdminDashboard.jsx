import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  const actions = [
    { to: "/admin/season", icon: "📅", label: "Tạo mùa giải", desc: "Khởi tạo mùa giải mới", color: "blue" },
    // ── BƯỚC 2 (bắt buộc trước Roster) ──
    { to: "/admin/season-teams", icon: "🏟️", label: "Đăng ký đội vào mùa", desc: "Bước bắt buộc trước đăng ký Roster", color: "yellow" },
    { to: "/admin/roster", icon: "👥", label: "Đăng ký Roster", desc: "Trigger kiểm tra tự động", color: "cyan" },
    { to: "/admin/transfer", icon: "🔄", label: "Chuyển nhượng", desc: "Atomic SQL Transaction", color: "purple" },
    { to: "/admin/match", icon: "🎮", label: "Nhập kết quả trận", desc: "Dual-write SQL + MongoDB", color: "red" },
    { to: "/admin/players", icon: "🛡️", label: "Quản lý tuyển thủ", desc: "Xem, ẩn/hiện tuyển thủ", color: "emerald" },
    { to: "/admin/roster-view", icon: "📋", label: "Xem Roster", desc: "Roster hiện tại theo mùa", color: "slate" },
  ];

  const colorMap = {
    blue:    "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    yellow:  "hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.20)]",
    cyan:    "hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    purple:  "hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    red:     "hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    emerald: "hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    slate:   "hover:border-slate-500/50 hover:shadow-[0_0_20px_rgba(148,163,184,0.10)]",
  };

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
          <p className="text-xs text-amber-400/70 mt-2 font-medium">
            ⚠️ Quy trình: Tạo mùa giải → Đăng ký đội vào mùa → Đăng ký Roster → Nhập kết quả
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl">
          {actions.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 ${colorMap[a.color]} transition-all transform hover:-translate-y-1 flex flex-col relative overflow-hidden`}
            >
              {/* Bước 2 badge */}
              {a.color === "yellow" && (
                <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
                  Bắt buộc
                </span>
              )}
              <div className="text-4xl mb-4">{a.icon}</div>
              <div className="font-bold text-slate-200 text-lg mb-1">{a.label}</div>
              <div className="text-xs text-slate-500 font-medium">{a.desc}</div>
              {/* Step indicator */}
              <div className="mt-3 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Bước {i + 1}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
