import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  Home,
  Trophy,
  BarChart3,
  Calendar,
  Swords,
  ArrowLeftRight,
  LineChart,
  TrendingDown,
  Scale,
  Flame,
  Target,
  FileText,
  LayoutDashboard,
  Shield,
  Users,
  Eye,
  Settings,
  Gamepad2,
  CalendarDays,
} from "lucide-react";

const SectionLabel = ({ label, color = "text-slate-500", glow }) => (
  <p
    className={`text-[10px] font-black ${color} uppercase tracking-widest mb-3 px-2 ${glow || ""}`}
  >
    {label}
  </p>
);

const Sidebar = () => {
  const { user, isAdmin, isAnalyst } = useAuth();

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border [&_svg]:shrink-0 ${
      isActive
        ? "bg-cyan-500/12 text-cyan-200 border-cyan-400/35 shadow-[0_0_18px_rgba(34,211,238,0.14)]"
        : "text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700/70"
    }`;

  return (
    <aside className="w-60 shrink-0 h-full bg-slate-950/85 backdrop-blur-2xl border-r border-slate-800/80 p-4 flex flex-col gap-6 shadow-[6px_0_24px_rgba(0,0,0,0.40)] font-sans overflow-y-auto dark-scrollbar">
      {/* ── PUBLIC (Fan) ── */}
      <div>
        <SectionLabel label="Dành cho Fan" color="text-cyan-500/60" />
        <div className="flex flex-col gap-1">
          <NavLink to="/" className={linkClass} end>
            <Home size={18} strokeWidth={2.2} />
            Trang Chủ
          </NavLink>

          <NavLink to="/leaderboard/players" className={linkClass}>
            <Trophy size={18} />
            BXH Tuyển Thủ
          </NavLink>

          <NavLink to="/standings" className={linkClass}>
            <BarChart3 size={18} />
            BXH Đội Tuyển
          </NavLink>

          <NavLink to="/schedule" className={linkClass}>
            <Calendar size={18} />
            Lịch Thi Đấu
          </NavLink>

          <NavLink to="/matches" className={linkClass}>
            <Swords size={18} />
            Lịch Sử Trận Đấu
          </NavLink>

          <NavLink to="/transfers" className={linkClass}>
            <ArrowLeftRight size={18} />
            Chuyển Nhượng
          </NavLink>
        </div>
      </div>

      {/* ── ANALYST ── */}
      {isAnalyst && (
        <div>
          <SectionLabel
            label="Phân Tích"
            color="text-purple-400/70"
            glow="drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]"
          />
          <div className="flex flex-col gap-1">
            <NavLink to="/analyst" className={linkClass} end>
              <span className="text-lg">
                <LineChart size={18} />
              </span>{" "}
              Dashboard
            </NavLink>
            <NavLink to="/analyst/form" className={linkClass}>
              <span className="text-lg">
                <TrendingDown size={18} />
              </span>{" "}
              Phong Độ Tuyển Thủ
            </NavLink>
            <NavLink to="/analyst/compare" className={linkClass}>
              <span className="text-lg">
                <Scale size={18} />
              </span>{" "}
              So Sánh Tuyển Thủ
            </NavLink>
            <NavLink to="/analyst/h2h" className={linkClass}>
              <span className="text-lg">
                <Swords size={18} />
              </span>{" "}
              Đối Đầu H2H
            </NavLink>
            <NavLink to="/analyst/meta" className={linkClass}>
              <span className="text-lg">
                <Flame size={18} />
              </span>{" "}
              Meta Tướng
            </NavLink>
            <NavLink to="/analyst/predict" className={linkClass}>
              <span className="text-lg">
                <Target size={18} />
              </span>{" "}
              Dự Đoán Trận
            </NavLink>
            <NavLink to="/analyst/report" className={linkClass}>
              <span className="text-lg">
                <FileText size={18} />
              </span>{" "}
              Báo Cáo Mùa
            </NavLink>
          </div>
        </div>
      )}

      {/* ── ADMIN ── */}
      {isAdmin && (
        <div>
          <SectionLabel
            label="Quản Trị"
            color="text-red-400/70"
            glow="drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]"
          />
          <div className="flex flex-col gap-1">
            <NavLink to="/admin" className={linkClass} end>
              <span className="text-lg">
                <LayoutDashboard size={18} />
              </span>{" "}
              Dashboard
            </NavLink>
            <NavLink to="/admin/season" className={linkClass}>
              <span className="text-lg">
                <CalendarDays size={18} />
              </span>{" "}
              Tạo Mùa Giải
            </NavLink>
            <NavLink to="/admin/season-teams" className={linkClass}>
              <span className="text-lg">
                <Shield size={18} />
              </span>{" "}
              Đăng ký đội vào mùa
            </NavLink>
            <NavLink to="/admin/roster" className={linkClass}>
              <span className="text-lg">
                <Users size={18} />
              </span>{" "}
              Đăng Ký Roster
            </NavLink>
            <NavLink to="/admin/roster-view" className={linkClass}>
              <span className="text-lg">
                <Eye size={18} />
              </span>{" "}
              Xem Roster
            </NavLink>
            <NavLink to="/admin/transfer" className={linkClass}>
              <span className="text-lg">
                <ArrowLeftRight size={18} />
              </span>{" "}
              Chuyển Nhượng
            </NavLink>
            <NavLink to="/admin/match" className={linkClass}>
              <span className="text-lg">
                <Gamepad2 size={18} />
              </span>{" "}
              Nhập Kết Quả
            </NavLink>
            <NavLink to="/admin/players" className={linkClass}>
              <span className="text-lg">
                <Settings size={18} />
              </span>{" "}
              Quản Lý Tuyển Thủ
            </NavLink>
          </div>
        </div>
      )}

      {/* User info footer */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-slate-700 flex items-center justify-center font-black text-cyan-400 text-sm">
            {user?.username?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-300 truncate">
              {user?.username}
            </div>
            <div className="text-xs text-slate-600 truncate">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
