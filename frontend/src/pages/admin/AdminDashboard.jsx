// frontend/src/pages/admin/AdminDashboard.jsx
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Swords,
  ArrowLeftRight,
  Eye,
  LayoutDashboard,
  Trophy,
  Gamepad2,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import * as XLSX from "xlsx";

/* ── Google Fonts + CSS ─────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-glow { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  .fade-up { animation: fadeUp .4s cubic-bezier(.22,.68,0,1.2) both; }
  .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
  .d4{animation-delay:.24s} .d5{animation-delay:.30s} .d6{animation-delay:.36s}

  .glow-pulse { animation: pulse-glow 3s ease infinite; }
  .dot-blink  { animation: dot-blink 1.8s ease infinite; }
  .spinner    {
    animation: spin .75s linear infinite;
    border-radius:50%;
    border:2px solid rgba(248,113,113,.15);
    border-top-color:#f87171;
    width:18px; height:18px; display:inline-block; flex-shrink:0;
  }

  /* Sidebar-matching card style */
  .nx-card {
    background: rgba(15,20,36,.95);
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 14px;
    transition: border-color .2s, box-shadow .2s;
  }
  .nx-card:hover {
    border-color: rgba(255,255,255,.1);
  }

  /* Thin scrollbar */
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:2px; }

  /* Select styling */
  .nx-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px !important;
  }

  .stat-card-glow {
    position:absolute; inset:0; border-radius:14px; pointer-events:none;
    opacity:0; transition:opacity .3s;
  }
  .nx-stat-card:hover .stat-card-glow { opacity:1; }

  /* Row hover */
  .row-hover { transition: background .15s; }
  .row-hover:hover { background: rgba(255,255,255,.025); }

  /* Quick action hover */
  .qa-card { transition: border-color .2s, transform .2s, background .2s; }
  .qa-card:hover { transform: translateY(-2px); }
`;

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (n, dec = 2) => (n == null ? "—" : Number(n).toFixed(dec));
const pct = (n) => (n == null ? "—" : `${fmt(n, 1)}%`);

const POSITION_COLOR = {
  Top: "#fb923c",
  Jungle: "#34d399",
  Mid: "#a78bfa",
  ADC: "#f87171",
  Support: "#38bdf8",
};

const RANK_COLOR = (rank) =>
  rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : "#b45309";

/* ── Sub-components ──────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, delay }) {
  return (
    <div
      className={`fade-up ${delay} nx-stat-card nx-card relative overflow-hidden flex items-center gap-4 p-5`}
    >
      <div
        className="stat-card-glow"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${accent}14, transparent 65%)`,
        }}
      />
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{ background: accent }}
      />

      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-2"
        style={{
          background: `${accent}12`,
          border: `1px solid ${accent}25`,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{
            color: "rgba(148,163,184,.55)",
            fontFamily: "'Rajdhani',sans-serif",
            letterSpacing: "0.14em",
          }}
        >
          {label}
        </div>
        <div
          className="text-3xl font-black text-white leading-none"
          style={{ fontFamily: "'Orbitron',monospace" }}
        >
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ color, title, children }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[3px] h-4 rounded-full"
          style={{ background: color }}
        />
        <span
          className="font-bold text-xs uppercase tracking-widest text-white"
          style={{
            fontFamily: "'Orbitron',monospace",
            letterSpacing: "0.16em",
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function QuickActionCard({ to, icon, label, desc, accent }) {
  return (
    <Link
      to={to}
      className="qa-card nx-card group relative overflow-hidden flex items-start gap-3 p-4"
      style={{ borderColor: `${accent}18` }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${accent}0d, transparent 60%)`,
        }}
      />
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
        style={{
          background: `${accent}12`,
          border: `1px solid ${accent}28`,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-xs font-bold text-white mb-0.5 leading-snug"
          style={{ fontFamily: "'Orbitron',monospace" }}
        >
          {label}
        </div>
        <div
          className="text-xs leading-relaxed"
          style={{ color: "rgba(148,163,184,.5)" }}
        >
          {desc}
        </div>
      </div>
      <div
        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0"
        style={{ color: accent }}
      >
        →
      </div>
    </Link>
  );
}

/* ── Excel Export ────────────────────────────────────────────── */
function exportToExcel(exportData, season) {
  const wb = XLSX.utils.book_new();

  const playersHeader = [
    ["BẢNG XẾP HẠNG TUYỂN THỦ - " + (season?.SeasonName || "")],
    [],
    [
      "Hạng",
      "Nickname",
      "Vị trí",
      "Đội",
      "Tên đội",
      "Số trận",
      "Kills",
      "Deaths",
      "Assists",
      "KDA TB",
      "GPM TB",
      "Win Rate (%)",
    ],
  ];
  const playersRows = (exportData?.players || []).map((p) => [
    p.KDA_Rank,
    p.Nickname,
    p.Position,
    p.TeamShort,
    p.TeamName,
    p.TotalMatches,
    p.TotalKills,
    p.TotalDeaths,
    p.TotalAssists,
    Number(p.AvgKDA),
    Number(p.AvgGPM),
    Number(p.WinRate),
  ]);
  const wsPlayers = XLSX.utils.aoa_to_sheet([...playersHeader, ...playersRows]);
  wsPlayers["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 20 },
    { wch: 8 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
  ];
  wsPlayers["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }];
  XLSX.utils.book_append_sheet(wb, wsPlayers, "Leaderboard Tuyển Thủ");

  const teamsHeader = [
    ["BẢNG XẾP HẠNG ĐỘI TUYỂN - " + (season?.SeasonName || "")],
    [],
    [
      "Hạng",
      "Tên đội",
      "Short",
      "Thắng",
      "Thua",
      "Tổng trận",
      "Điểm",
      "Win Rate (%)",
      "Goal Diff",
    ],
  ];
  const teamsRows = (exportData?.teams || []).map((t) => [
    t.Standing_Rank,
    t.TeamName,
    t.ShortName,
    t.Wins,
    t.Losses,
    t.TotalMatches,
    t.Points,
    Number(t.WinRate),
    t.GoalDiff,
  ]);
  const wsTeams = XLSX.utils.aoa_to_sheet([...teamsHeader, ...teamsRows]);
  wsTeams["!cols"] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 8 },
    { wch: 7 },
    { wch: 7 },
    { wch: 10 },
    { wch: 7 },
    { wch: 12 },
    { wch: 10 },
  ];
  wsTeams["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
  XLSX.utils.book_append_sheet(wb, wsTeams, "Xếp Hạng Đội");

  const fileName = `BaoCao_${season?.SeasonID || "season"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/* ── Main Component ──────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSelectedSeason(active.SeasonID);
      })
      .catch(() => setError("Không lấy được danh sách mùa giải."));
  }, []);

  const loadStats = useCallback(async (sid) => {
    if (!sid) return;
    setLoading(true);
    setError(null);
    try {
      const r = await axiosClient.get(`/admin/dashboard?seasonId=${sid}`);
      setStats(r.data);
    } catch {
      setError("Không lấy được dữ liệu dashboard.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(selectedSeason);
  }, [selectedSeason, loadStats]);

  const handleExport = () => {
    if (!stats?.exportData) return;
    setExporting(true);
    setTimeout(() => {
      exportToExcel(stats.exportData, stats.season);
      setExporting(false);
    }, 200);
  };

  const counts = stats?.counts || {};
  const season = stats?.season;

  const ACTIONS = [
    {
      to: "/admin/season",
      icon: <CalendarDays size={18} />,
      label: "Tạo mùa giải",
      desc: "Khởi tạo mùa thi đấu mới",
      accent: "#38bdf8",
    },
    {
      to: "/admin/roster",
      icon: <Users size={18} />,
      label: "Đăng ký Roster",
      desc: "Đăng ký đội tuyển vào mùa giải",
      accent: "#a78bfa",
    },
    {
      to: "/admin/roster-view",
      icon: <Eye size={18} />,
      label: "Xem Roster",
      desc: "Danh sách tuyển thủ từng đội",
      accent: "#34d399",
    },
    {
      to: "/admin/transfer",
      icon: <ArrowLeftRight size={18} />,
      label: "Chuyển nhượng",
      desc: "Chuyển nhượng tuyển thủ",
      accent: "#fb923c",
    },
    {
      to: "/admin/match",
      icon: <Gamepad2 size={18} />,
      label: "Nhập kết quả",
      desc: "Nhập kết quả thi đấu",
      accent: "#f87171",
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#0a0e1a",
        fontFamily: "'Rajdhani','Segoe UI',sans-serif",
      }}
    >
      <style>{STYLE}</style>

      {/* ── Subtle background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(248,113,113,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(248,113,113,.6) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute -top-48 right-0 w-[560px] h-[420px] glow-pulse"
          style={{
            background:
              "radial-gradient(ellipse,rgba(248,113,113,.09) 0%,transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96"
          style={{
            background:
              "radial-gradient(ellipse,rgba(56,189,248,.05) 0%,transparent 68%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-7 lg:px-10 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb-style label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="dot-blink w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{ color: "rgba(248,113,113,.65)" }}
              >
                Ban tổ chức
              </span>
            </div>
            <h1
              className="text-[26px] sm:text-[30px] font-black uppercase text-white leading-none"
              style={{
                fontFamily: "'Orbitron',monospace",
                textShadow: "0 0 24px rgba(248,113,113,.22)",
              }}
            >
              Admin Dashboard
            </h1>
            <p
              className="text-sm mt-1.5"
              style={{ color: "rgba(148,163,184,.6)" }}
            >
              Xin chào,{" "}
              <span style={{ color: "#f87171", fontWeight: 700 }}>
                {user?.username}
              </span>
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="nx-select text-sm font-semibold rounded-xl px-4 py-2.5 outline-none transition-all cursor-pointer"
              style={{
                background: "rgba(15,20,36,.95)",
                border: "1px solid rgba(248,113,113,.2)",
                color: "#f87171",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.72rem",
              }}
            >
              <option value="">-- Chọn mùa giải --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} [{s.Status}]
                </option>
              ))}
            </select>

            <button
              onClick={handleExport}
              disabled={exporting || !stats?.exportData}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.03] hover:brightness-110 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#15803d,#22c55e)",
                boxShadow: "0 0 16px rgba(34,197,94,.22)",
                fontFamily: "'Orbitron',monospace",
              }}
            >
              {exporting && (
                <span className="spinner" style={{ borderTopColor: "#fff" }} />
              )}
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div
            className="fade-up px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{
              background: "rgba(248,113,113,.07)",
              border: "1px solid rgba(248,113,113,.2)",
              color: "#f87171",
            }}
          >
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Season Info Banner ── */}
        {season && (
          <div
            className="fade-up d1 nx-card px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3"
            style={{ borderColor: "rgba(248,113,113,.12)" }}
          >
            {/* Season Name */}
            <div>
              <div
                className="text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.45)" }}
              >
                Mùa giải
              </div>
              <div
                className="text-base font-black text-white"
                style={{ fontFamily: "'Orbitron',monospace" }}
              >
                {season.SeasonName}
              </div>
            </div>

            <div
              className="h-7 w-px hidden sm:block"
              style={{ background: "rgba(255,255,255,.07)" }}
            />

            {/* Date Range */}
            <div>
              <div
                className="text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.45)" }}
              >
                Thời gian
              </div>
              <div className="text-sm font-semibold text-white">
                {new Date(season.StartDate).toLocaleDateString("vi-VN")}
                <span
                  style={{ color: "rgba(148,163,184,.4)", margin: "0 6px" }}
                >
                  →
                </span>
                {new Date(season.EndDate).toLocaleDateString("vi-VN")}
              </div>
            </div>

            <div
              className="h-7 w-px hidden sm:block"
              style={{ background: "rgba(255,255,255,.07)" }}
            />

            {/* Format */}
            <div>
              <div
                className="text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.45)" }}
              >
                Format
              </div>
              <div
                className="text-sm font-black"
                style={{ color: "#38bdf8", fontFamily: "'Orbitron',monospace" }}
              >
                {season.Format}
              </div>
            </div>

            {/* Status badge – right aligned */}
            <div className="ml-auto">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{
                  background:
                    season.Status === "ACTIVE"
                      ? "rgba(52,211,153,.1)"
                      : "rgba(251,146,60,.1)",
                  color: season.Status === "ACTIVE" ? "#34d399" : "#fb923c",
                  border: `1px solid ${season.Status === "ACTIVE" ? "rgba(52,211,153,.25)" : "rgba(251,146,60,.25)"}`,
                  fontFamily: "'Orbitron',monospace",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      season.Status === "ACTIVE" ? "#34d399" : "#fb923c",
                  }}
                />
                {season.Status}
              </span>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <span className="spinner" style={{ width: 26, height: 26 }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "rgba(148,163,184,.5)" }}
            >
              Đang tải dữ liệu...
            </span>
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Trophy size={22} />}
                label="Đội tham gia"
                value={counts.TotalTeams}
                accent="#f87171"
                delay="d1"
              />
              <StatCard
                icon={<Gamepad2 size={22} />}
                label="Tuyển thủ"
                value={counts.TotalPlayers}
                accent="#38bdf8"
                delay="d2"
              />
              <StatCard
                icon={<Swords size={22} />}
                label="Trận đã đấu"
                value={counts.TotalMatches}
                accent="#a78bfa"
                delay="d3"
              />
              <StatCard
                icon={<ArrowLeftRight size={22} />}
                label="Chuyển nhượng"
                value={counts.TotalTransfers}
                accent="#34d399"
                delay="d4"
              />
            </div>

            {/* ── Data Panels ── */}
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Top Teams */}
              <div
                className="fade-up d2 nx-card overflow-hidden"
                style={{ borderColor: "rgba(251,146,60,.1)" }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
                >
                  <SectionHeader color="#fb923c" title="Top Đội Tuyển" />
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  {(stats?.topTeams || []).length === 0 && (
                    <div
                      className="text-sm text-center py-8"
                      style={{ color: "rgba(148,163,184,.35)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                  {(stats?.topTeams || []).map((t) => (
                    <div
                      key={t.ShortName}
                      className="row-hover flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    >
                      <div
                        className="w-7 text-center font-black text-sm flex-shrink-0"
                        style={{
                          color: RANK_COLOR(t.Standing_Rank),
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        #{t.Standing_Rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {t.TeamName}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "rgba(148,163,184,.45)" }}
                        >
                          {t.Wins}W — {t.Losses}L · {t.Points}pts
                        </div>
                      </div>
                      <div
                        className="text-sm font-black flex-shrink-0"
                        style={{
                          color: "#fb923c",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {pct(t.WinRate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top KDA */}
              <div
                className="fade-up d3 nx-card overflow-hidden"
                style={{ borderColor: "rgba(167,139,250,.1)" }}
              >
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
                >
                  <SectionHeader color="#a78bfa" title="Top KDA">
                    <Link
                      to="/leaderboard/players"
                      className="text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-purple-400"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Tất cả →
                    </Link>
                  </SectionHeader>
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  {(stats?.topPlayers || []).length === 0 && (
                    <div
                      className="text-sm text-center py-8"
                      style={{ color: "rgba(148,163,184,.35)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                  {(stats?.topPlayers || []).map((p) => (
                    <div
                      key={p.Nickname}
                      className="row-hover flex items-center gap-3 px-3 py-2 rounded-xl"
                    >
                      <div
                        className="w-6 text-center font-black text-xs flex-shrink-0"
                        style={{
                          color:
                            p.KDA_Rank === 1
                              ? "#fbbf24"
                              : "rgba(148,163,184,.35)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {`#${p.KDA_Rank}`}
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                        style={{
                          background: `${POSITION_COLOR[p.Position] || "#94a3b8"}15`,
                          color: POSITION_COLOR[p.Position] || "#94a3b8",
                          border: `1px solid ${POSITION_COLOR[p.Position] || "#94a3b8"}28`,
                        }}
                      >
                        {p.Nickname.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {p.Nickname}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "rgba(148,163,184,.45)" }}
                        >
                          {p.TeamShort} · {p.Position}
                        </div>
                      </div>
                      <div
                        className="text-sm font-black flex-shrink-0"
                        style={{
                          color: "#a78bfa",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {fmt(p.AvgKDA)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Matches */}
              <div
                className="fade-up d4 nx-card overflow-hidden"
                style={{ borderColor: "rgba(56,189,248,.1)" }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
                >
                  <SectionHeader color="#38bdf8" title="Trận Gần Nhất" />
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  {(stats?.recentMatches || []).length === 0 && (
                    <div
                      className="text-sm text-center py-8"
                      style={{ color: "rgba(148,163,184,.35)" }}
                    >
                      Chưa có trận đấu
                    </div>
                  )}
                  {(stats?.recentMatches || []).map((m) => (
                    <div
                      key={m.MatchID}
                      className="row-hover flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    >
                      <span
                        className="font-black text-xs text-white w-10 text-right flex-shrink-0"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team1}
                      </span>
                      <div className="flex-1 flex items-center justify-center">
                        <span
                          className="text-[11px] font-black px-2.5 py-1 rounded-lg"
                          style={{
                            background: "rgba(56,189,248,.08)",
                            color: "#38bdf8",
                            fontFamily: "'Orbitron',monospace",
                            border: "1px solid rgba(56,189,248,.15)",
                          }}
                        >
                          {m.Team1Score}—{m.Team2Score}
                        </span>
                      </div>
                      <span
                        className="font-black text-xs text-white w-10 flex-shrink-0"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team2}
                      </span>
                      <div
                        className="text-[10px] flex-shrink-0 text-right"
                        style={{
                          color: "rgba(148,163,184,.35)",
                          minWidth: "36px",
                        }}
                      >
                        {m.MatchDate
                          ? new Date(m.MatchDate).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="fade-up d5">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3 px-1"
                style={{
                  color: "rgba(148,163,184,.38)",
                  fontFamily: "'Rajdhani',sans-serif",
                }}
              >
                Thao tác nhanh
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ACTIONS.map((a) => (
                  <QuickActionCard key={a.to} {...a} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
