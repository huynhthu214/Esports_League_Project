import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useEffect, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  BarChart3,
  CalendarDays,
  Flame,
  Gamepad2,
  Lock,
  Swords,
  TrendingUp,
  Trophy,
} from "lucide-react";

const ROLE_COLOR = {
  Top: "#fb923c",
  Jungle: "#34d399",
  Mid: "#a78bfa",
  ADC: "#f87171",
  Support: "#38bdf8",
};

// ── Particle background ──────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,237,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
    />
  );
}

const fmtTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden flex items-center gap-4"
      style={{
        background: "rgba(13,17,30,0.85)",
        border: `1px solid ${accent}30`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 50%, ${accent}, transparent 70%)`,
        }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
      >
        {icon}
      </div>
      <div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: accent }}
        >
          {label}
        </div>
        <div
          className="text-2xl font-black text-white"
          style={{ fontFamily: "'Orbitron', monospace" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ── QuickLink ─────────────────────────────────────────────────────────────────
function QuickLink({ to, icon, title, desc, accent }) {
  return (
    <Link
      to={to}
      className="group relative rounded-2xl p-5 overflow-hidden block transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(13,17,30,0.85)",
        border: `1px solid ${accent}25`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
      <div className="text-3xl mb-3">{icon}</div>
      <div
        className="font-bold text-white mb-1 group-hover:text-white transition-colors"
        style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
      >
        {title}
      </div>
      <div
        className="text-xs leading-relaxed"
        style={{ color: "rgba(148,163,184,0.8)" }}
      >
        {desc}
      </div>
      <div
        className="mt-3 text-xs font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: accent }}
      >
        Xem ngay <span>→</span>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const Home = () => {
  const { isLoggedIn, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [season, setSeason] = useState(null);
  const [counts, setCounts] = useState({
    TotalTeams: 0,
    TotalMatches: 0,
    TotalPlayers: 0,
    TotalTransfers: 0,
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (!active) throw new Error("Chưa có mùa giải.");
        return axiosClient.get("/admin/dashboard", {
          params: { seasonId: active.SeasonID },
        });
      })
      .then((r) => {
        if (!mounted) return;
        setSeason(r.data?.season || null);
        setCounts(r.data?.counts || {});
        setRecentMatches(
          Array.isArray(r.data?.recentMatches) ? r.data.recentMatches : [],
        );
        setTopPlayers(
          Array.isArray(r.data?.topPlayers) ? r.data.topPlayers : [],
        );
      })
      .catch((e) => {
        if (!mounted) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được dữ liệu trang chủ.",
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#080c16",
        fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        @keyframes scanline { 0% { top:-10%; } 100% { top:110%; } }
        .fade-up { animation: fadeUp .55s ease both; }
        .delay-1 { animation-delay:.1s; }
        .delay-2 { animation-delay:.2s; }
        .delay-3 { animation-delay:.3s; }
        .delay-4 { animation-delay:.4s; }
        .glow-pulse { animation: glow 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* deep grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,179,237,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* top glow blob */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full glow-pulse"
          style={{
            background:
              "radial-gradient(ellipse, rgba(56,189,248,.18) 0%, transparent 70%)",
          }}
        />
        {/* bottom right blob */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(139,92,246,.4) 0%, transparent 70%)",
          }}
        />
        <Particles />
      </div>

      <div
        className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {/* ── HERO ── */}
        <div className="fade-up mb-10">
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,17,30,.95) 0%, rgba(15,23,42,.9) 100%)",
              border: "1px solid rgba(56,189,248,.15)",
            }}
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
              <div
                className="absolute left-0 right-0 h-[2px] bg-cyan-400"
                style={{ animation: "scanline 4s linear infinite" }}
              />
            </div>
            {/* Hero content */}
            <div className="relative flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-10">
              {/* Text */}
              <div className="flex-1 text-center lg:text-left">
                <div
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] mb-4 px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(56,189,248,.1)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56,189,248,.25)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {season?.SeasonName
                    ? `${season.SeasonName} · ${season.Status}`
                    : "Season · LIVE"}
                </div>
                <h1
                  className="text-4xl lg:text-5xl font-black uppercase leading-none mb-4 text-white"
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    textShadow: "0 0 40px rgba(56,189,248,.4)",
                  }}
                >
                  NEXUS
                  <br />
                  <span
                    style={{
                      WebkitTextStroke: "1px rgba(56,189,248,.6)",
                      color: "transparent",
                    }}
                  >
                    ESPORTS
                  </span>
                  <br />
                  LEAGUE
                </h1>
                <p
                  className="text-sm leading-relaxed max-w-md mb-6"
                  style={{ color: "rgba(148,163,184,.8)" }}
                >
                  Hệ thống quản lý giải đấu chuyên nghiệp, theo dõi thống kê
                  trận đấu, phân tích phong độ tuyển thủ và bảng xếp hạng theo
                  thời gian thực.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Link
                    to="/leaderboard/players"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                      boxShadow: "0 0 20px rgba(56,189,248,.4)",
                    }}
                  >
                    Bảng Xếp Hạng
                  </Link>
                  <Link
                    to="/standings"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:scale-105"
                    style={{
                      background: "rgba(56,189,248,.08)",
                      border: "1px solid rgba(56,189,248,.3)",
                      color: "#38bdf8",
                    }}
                  >
                    Xếp Hạng Đội
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[320px]">
                <StatCard
                  icon={<Trophy size={22} />}
                  label="Đội tham gia"
                  value={loading ? "—" : String(counts?.TotalTeams ?? 0)}
                  accent="#38bdf8"
                />
                <StatCard
                  icon={<Swords size={22} />}
                  label="Trận đã đấu"
                  value={loading ? "—" : String(counts?.TotalMatches ?? 0)}
                  accent="#a78bfa"
                />
                <StatCard
                  icon={<Gamepad2 size={22} />}
                  label="Tuyển thủ"
                  value={loading ? "—" : String(counts?.TotalPlayers ?? 0)}
                  accent="#34d399"
                />
                <StatCard
                  icon={<CalendarDays size={22} />}
                  label="Chuyển nhượng"
                  value={loading ? "—" : String(counts?.TotalTransfers ?? 0)}
                  accent="#fb923c"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left — Recent matches + Quick links */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Recent Matches */}
            <div
              className="fade-up delay-1 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,17,30,.85)",
                border: "1px solid rgba(56,189,248,.1)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(56,189,248,.08)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#38bdf8" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron', monospace" }}
                  >
                    Trận gần nhất
                  </span>
                </div>
                <Link
                  to="/standings"
                  className="text-xs font-semibold uppercase tracking-widest hover:text-cyan-400 transition-colors"
                  style={{ color: "rgba(148,163,184,.6)" }}
                >
                  Xem tất cả →
                </Link>
              </div>
              <div
                className="divide-y"
                style={{ divideColor: "rgba(56,189,248,.06)" }}
              >
                {error && (
                  <div
                    className="px-5 py-4 text-sm font-semibold"
                    style={{
                      color: "#f87171",
                      background: "rgba(248,113,113,.06)",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}
                {!loading && recentMatches.length === 0 && !error && (
                  <div
                    className="px-5 py-10 text-center text-sm"
                    style={{ color: "rgba(148,163,184,.5)" }}
                  >
                    Chưa có trận đấu nào trong mùa này.
                  </div>
                )}
                {(loading ? Array.from({ length: 3 }) : recentMatches).map(
                  (m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Teams */}
                      <div className="flex-1 flex items-center justify-center gap-3">
                        <span
                          className="font-black text-sm text-white w-16 text-right"
                          style={{ fontFamily: "'Orbitron', monospace" }}
                        >
                          {loading ? "—" : m.Team1 || "—"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-base font-black px-3 py-1 rounded-lg"
                            style={{
                              background: "rgba(56,189,248,.1)",
                              color: "#38bdf8",
                              fontFamily: "'Orbitron', monospace",
                            }}
                          >
                            {loading
                              ? "—"
                              : `${m.Team1Score ?? "—"}-${m.Team2Score ?? "—"}`}
                          </span>
                        </div>
                        <span
                          className="font-black text-sm text-white w-16"
                          style={{ fontFamily: "'Orbitron', monospace" }}
                        >
                          {loading ? "—" : m.Team2 || "—"}
                        </span>
                      </div>
                      {/* Meta */}
                      <div className="hidden sm:flex flex-col items-end gap-0.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "rgba(148,163,184,.7)" }}
                        >
                          {loading ? "—" : fmtTime(m.MatchDate)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.4)" }}
                        >
                          {loading
                            ? " "
                            : m.Winner
                              ? `Winner: ${m.Winner}`
                              : " "}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="fade-up delay-2">
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Truy cập nhanh
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <QuickLink
                  to="/leaderboard/players"
                  icon={<Trophy size={22} />}
                  accent="#38bdf8"
                  title="Bảng Xếp Hạng KDA"
                  desc="Top tuyển thủ xuất sắc nhất theo KDA, GPM và các chỉ số toàn mùa."
                />
                <QuickLink
                  to="/standings"
                  icon={<BarChart3 size={22} />}
                  accent="#a78bfa"
                  title="Xếp Hạng Đội Tuyển"
                  desc="Bảng điểm, tỷ lệ thắng/thua và phong độ từng đội trong mùa giải."
                />
                {isLoggedIn && (
                  <>
                    <QuickLink
                      to="/analyst/form"
                      icon={<TrendingUp size={22} />}
                      accent="#34d399"
                      title="Phong Độ Tuyển Thủ"
                      desc="Phân tích form 50 trận gần nhất, xu hướng tăng/giảm hiệu suất."
                    />
                    <QuickLink
                      to="/analyst/meta"
                      icon={<Flame size={22} />}
                      accent="#fb923c"
                      title="Meta Tướng Mùa Này"
                      desc="Tướng pick/ban nhiều nhất và win-rate theo vị trí thi đấu."
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right — Leaderboard preview + Auth */}
          <div className="flex flex-col gap-5">
            {/* Top 5 Players */}
            <div
              className="fade-up delay-2 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,17,30,.85)",
                border: "1px solid rgba(167,139,250,.1)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(167,139,250,.08)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#a78bfa" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron', monospace" }}
                  >
                    Top KDA
                  </span>
                </div>
                <Link
                  to="/leaderboard/players"
                  className="text-xs font-semibold uppercase tracking-widest hover:text-purple-400 transition-colors"
                  style={{ color: "rgba(148,163,184,.6)" }}
                >
                  Tất cả →
                </Link>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {(loading ? Array.from({ length: 5 }) : topPlayers).map(
                  (p, idx) => {
                    const rank = loading ? idx + 1 : p.KDA_Rank;
                    const role = loading ? "Mid" : p.Position;
                    const accent = ROLE_COLOR[role] || "#94a3b8";
                    const name = loading ? "—" : p.Nickname;
                    const team = loading ? "—" : p.TeamShort;
                    const kda = loading ? "—" : Number(p.AvgKDA).toFixed(2);
                    return (
                      <div
                        key={rank}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                      >
                        {/* Rank */}
                        <div
                          className="w-6 text-center font-black text-xs"
                          style={{
                            color:
                              rank === 1
                                ? "#fbbf24"
                                : rank === 2
                                  ? "#94a3b8"
                                  : rank === 3
                                    ? "#b45309"
                                    : "rgba(148,163,184,.4)",
                            fontFamily: "'Orbitron', monospace",
                          }}
                        >
                          {`#${rank}`}
                        </div>
                        {/* Avatar placeholder */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{
                            background: `${accent}18`,
                            color: accent,
                            border: `1px solid ${accent}30`,
                          }}
                        >
                          {String(name || "??")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        {/* Name + team */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {name}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: "rgba(148,163,184,.5)" }}
                          >
                            {team} · {role}
                          </div>
                        </div>
                        {/* KDA */}
                        <div
                          className="text-sm font-black"
                          style={{
                            color: "#38bdf8",
                            fontFamily: "'Orbitron', monospace",
                          }}
                        >
                          {kda}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Auth Banner */}
            <div className="fade-up delay-3">
              {!isLoggedIn ? (
                <div
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(13,17,30,.85)",
                    border: "1px solid rgba(56,189,248,.15)",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      background:
                        "radial-gradient(circle at 100% 0%, #38bdf8, transparent 60%)",
                    }}
                  />
                  <Lock size={24} className="mb-2 mx-auto text-slate-500" />
                  <div
                    className="font-bold text-white mb-1 text-sm"
                    style={{ fontFamily: "'Orbitron', monospace" }}
                  >
                    Khu vực quản trị
                  </div>
                  <p
                    className="text-xs leading-relaxed mb-4"
                    style={{ color: "rgba(148,163,184,.7)" }}
                  >
                    Đăng nhập với tài khoản Admin hoặc Analyst để xem thống kê
                    và phân tích chuyên sâu.
                  </p>
                  <Link
                    to="/login"
                    className="block text-center px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      boxShadow: "0 0 20px rgba(56,189,248,.3)",
                    }}
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                <div
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(13,17,30,.85)",
                    border: "1px solid rgba(52,211,153,.2)",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      background:
                        "radial-gradient(circle at 0% 100%, #34d399, transparent 60%)",
                    }}
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                      style={{
                        background: "rgba(52,211,153,.15)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,.3)",
                      }}
                    >
                      {user?.username?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {user?.username}
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider"
                        style={{
                          background: "rgba(52,211,153,.15)",
                          color: "#34d399",
                          border: "1px solid rgba(52,211,153,.3)",
                        }}
                      >
                        {user?.role}
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(148,163,184,.6)" }}
                  >
                    Chào mừng trở lại! Bạn đã đăng nhập thành công.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
