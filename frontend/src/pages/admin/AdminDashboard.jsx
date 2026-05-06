// frontend/src/pages/admin/AdminDashboard.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import * as XLSX from "xlsx";

/* ── Google Fonts + CSS ─────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .45s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s} .d3{animation-delay:.15s}
  .d4{animation-delay:.2s}  .d5{animation-delay:.25s} .d6{animation-delay:.3s}
  .glow-red { animation: pulse-glow 2.5s ease infinite; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(248,113,113,.2); border-top-color:#f87171; width:20px; height:20px; display:inline-block; }
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

/* ── Sub-components ──────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, delay }) {
  return (
    <div
      className={`fade-up ${delay} relative rounded-2xl p-5 overflow-hidden flex items-center gap-4`}
      style={{
        background: "rgba(13,17,30,.9)",
        border: `1px solid ${accent}28`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `radial-gradient(circle at 0% 50%, ${accent}, transparent 70%)`,
        }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
      >
        {icon}
      </div>
      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest mb-0.5"
          style={{
            color: accent,
            fontFamily: "'Rajdhani',sans-serif",
            letterSpacing: "0.15em",
          }}
        >
          {label}
        </div>
        <div
          className="text-3xl font-black text-white"
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
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: color }} />
        <span
          className="font-bold text-sm uppercase tracking-widest text-white"
          style={{ fontFamily: "'Orbitron',monospace" }}
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
      className="group relative rounded-xl p-4 overflow-hidden flex items-start gap-3 transition-all duration-250 hover:-translate-y-0.5"
      style={{
        background: "rgba(13,17,30,.9)",
        border: `1px solid ${accent}20`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)`,
        }}
      />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
        style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
      >
        {icon}
      </div>
      <div>
        <div
          className="text-sm font-bold text-white mb-0.5"
          style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.75rem" }}
        >
          {label}
        </div>
        <div
          className="text-xs leading-relaxed"
          style={{ color: "rgba(148,163,184,.65)" }}
        >
          {desc}
        </div>
      </div>
      <div
        className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity self-center"
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

  // Sheet 1: Tuyển thủ
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

  // Sheet 2: Đội tuyển
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

  // Load danh sách mùa giải
  useEffect(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        // Tự chọn mùa ACTIVE hoặc mùa đầu tiên
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSelectedSeason(active.SeasonID);
      })
      .catch(() => setError("Không lấy được danh sách mùa giải."));
  }, []);

  // Load stats khi chọn mùa
  const loadStats = useCallback(async (sid) => {
    if (!sid) return;
    setLoading(true);
    setError(null);
    try {
      const r = await axiosClient.get(`/admin/dashboard?seasonId=${sid}`);
      setStats(r.data);
    } catch {
      setError(
        "Không lấy được dữ liệu dashboard. Kiểm tra SQL Server đang chạy chưa.",
      );
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
      icon: "📅",
      label: "Tạo mùa giải",
      desc: "Khởi tạo mùa thi đấu mới",
      accent: "#38bdf8",
    },
    {
      to: "/admin/roster",
      icon: "👥",
      label: "Đăng ký Roster",
      desc: "Đăng ký đội tuyển vào mùa giải",
      accent: "#a78bfa",
    },
    {
      to: "/admin/roster-view",
      icon: "👁️",
      label: "Xem Roster",
      desc: "Danh sách tuyển thủ từng đội",
      accent: "#34d399",
    },
    {
      to: "/admin/transfer",
      icon: "🔄",
      label: "Chuyển nhượng",
      desc: "Atomic SQL Transaction transfer",
      accent: "#fb923c",
    },
    {
      to: "/admin/match",
      icon: "🎮",
      label: "Nhập kết quả",
      desc: "Dual-write SQL + MongoDB",
      accent: "#f87171",
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#080c16",
        fontFamily: "'Rajdhani','Segoe UI',sans-serif",
      }}
    >
      <style>{STYLE}</style>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(248,113,113,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(248,113,113,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-40 right-0 w-[500px] h-[400px] rounded-full glow-red"
          style={{
            background:
              "radial-gradient(ellipse,rgba(248,113,113,.12) 0%,transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(56,189,248,.06) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: "rgba(248,113,113,.7)" }}
              >
                Ban tổ chức
              </span>
            </div>
            <h1
              className="text-3xl font-black uppercase text-white"
              style={{
                fontFamily: "'Orbitron',monospace",
                textShadow: "0 0 30px rgba(248,113,113,.3)",
              }}
            >
              Admin Dashboard
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "rgba(148,163,184,.7)" }}
            >
              Xin chào,{" "}
              <span style={{ color: "#f87171", fontWeight: 700 }}>
                {user?.username}
              </span>
            </p>
          </div>

          {/* Season selector + Export */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none transition-all"
              style={{
                background: "rgba(13,17,30,.9)",
                border: "1px solid rgba(248,113,113,.25)",
                color: "#f87171",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.75rem",
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                boxShadow: "0 0 18px rgba(34,197,94,.3)",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.7rem",
              }}
            >
              {exporting ? <span className="spinner" /> : ""}
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="fade-up mb-6 px-5 py-4 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.25)",
              color: "#f87171",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── Season Info Banner ── */}
        {season && (
          <div
            className="fade-up d1 mb-6 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-6"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(248,113,113,.15)",
            }}
          >
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Mùa giải
              </div>
              <div
                className="text-lg font-black text-white"
                style={{ fontFamily: "'Orbitron',monospace" }}
              >
                {season.SeasonName}
              </div>
            </div>
            <div
              className="h-8 w-px"
              style={{ background: "rgba(248,113,113,.2)" }}
            />
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Thời gian
              </div>
              <div className="text-sm font-semibold text-white">
                {new Date(season.StartDate).toLocaleDateString("vi-VN")} →{" "}
                {new Date(season.EndDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <div
              className="h-8 w-px"
              style={{ background: "rgba(248,113,113,.2)" }}
            />
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(148,163,184,.5)" }}
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
            <div className="ml-auto">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
                style={{
                  background:
                    season.Status === "ACTIVE"
                      ? "rgba(52,211,153,.15)"
                      : "rgba(251,146,60,.15)",
                  color: season.Status === "ACTIVE" ? "#34d399" : "#fb923c",
                  border: `1px solid ${season.Status === "ACTIVE" ? "rgba(52,211,153,.3)" : "rgba(251,146,60,.3)"}`,
                  fontFamily: "'Orbitron',monospace",
                }}
              >
                {season.Status === "ACTIVE" ? "🟢 " : "🟡 "}
                {season.Status}
              </span>
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <span className="spinner" style={{ width: 28, height: 28 }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "rgba(148,163,184,.6)" }}
            >
              Đang tải dữ liệu...
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="🏟️"
                label="Đội tham gia"
                value={counts.TotalTeams}
                accent="#f87171"
                delay="d1"
              />
              <StatCard
                icon="🎮"
                label="Tuyển thủ"
                value={counts.TotalPlayers}
                accent="#38bdf8"
                delay="d2"
              />
              <StatCard
                icon="⚔️"
                label="Trận đã đấu"
                value={counts.TotalMatches}
                accent="#a78bfa"
                delay="d3"
              />
              <StatCard
                icon="🔄"
                label="Chuyển nhượng"
                value={counts.TotalTransfers}
                accent="#34d399"
                delay="d4"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-5 mb-6">
              {/* Top Teams */}
              <div
                className="fade-up d2 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(251,146,60,.12)",
                }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(251,146,60,.08)" }}
                >
                  <SectionHeader color="#fb923c" title="Top Đội Tuyển" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {(stats?.topTeams || []).length === 0 && (
                    <div
                      className="text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                  {(stats?.topTeams || []).map((t) => (
                    <div
                      key={t.ShortName}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[.02] transition-colors"
                    >
                      <div
                        className="w-7 text-center font-black text-sm"
                        style={{
                          color:
                            t.Standing_Rank === 1
                              ? "#fbbf24"
                              : t.Standing_Rank === 2
                                ? "#94a3b8"
                                : "#b45309",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        #{t.Standing_Rank}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">
                          {t.TeamName}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.5)" }}
                        >
                          {t.Wins}W — {t.Losses}L · {t.Points}pts
                        </div>
                      </div>
                      <div
                        className="text-sm font-black"
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

              {/* Top Players KDA */}
              <div
                className="fade-up d3 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(167,139,250,.12)",
                }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(167,139,250,.08)" }}
                >
                  <SectionHeader color="#a78bfa" title="Top KDA">
                    <Link
                      to="/leaderboard/players"
                      className="text-xs font-semibold uppercase tracking-widest hover:text-purple-400 transition-colors"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      Tất cả →
                    </Link>
                  </SectionHeader>
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  {(stats?.topPlayers || []).length === 0 && (
                    <div
                      className="text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                  {(stats?.topPlayers || []).map((p) => (
                    <div
                      key={p.Nickname}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[.02] transition-colors"
                    >
                      <div
                        className="w-7 text-center font-black text-xs"
                        style={{
                          color:
                            p.KDA_Rank === 1
                              ? "#fbbf24"
                              : "rgba(148,163,184,.4)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {p.KDA_Rank === 1 ? "👑" : `#${p.KDA_Rank}`}
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{
                          background: `${POSITION_COLOR[p.Position] || "#94a3b8"}18`,
                          color: POSITION_COLOR[p.Position] || "#94a3b8",
                          border: `1px solid ${POSITION_COLOR[p.Position] || "#94a3b8"}30`,
                        }}
                      >
                        {p.Nickname.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {p.Nickname}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.5)" }}
                        >
                          {p.TeamShort} · {p.Position}
                        </div>
                      </div>
                      <div
                        className="text-sm font-black"
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
                className="fade-up d4 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(56,189,248,.12)",
                }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(56,189,248,.08)" }}
                >
                  <SectionHeader color="#38bdf8" title="Trận Gần Nhất" />
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {(stats?.recentMatches || []).length === 0 && (
                    <div
                      className="text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có trận đấu
                    </div>
                  )}
                  {(stats?.recentMatches || []).map((m) => (
                    <div
                      key={m.MatchID}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/[.02] transition-colors"
                    >
                      <span
                        className="font-black text-xs text-white w-12 text-right flex-shrink-0"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team1}
                      </span>
                      <div className="flex-1 flex items-center justify-center">
                        <span
                          className="text-xs font-black px-2.5 py-1 rounded-lg"
                          style={{
                            background: "rgba(56,189,248,.1)",
                            color: "#38bdf8",
                            fontFamily: "'Orbitron',monospace",
                          }}
                        >
                          {m.Team1Score}—{m.Team2Score}
                        </span>
                      </div>
                      <span
                        className="font-black text-xs text-white w-12 flex-shrink-0"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team2}
                      </span>
                      <div
                        className="ml-1 text-xs flex-shrink-0"
                        style={{ color: "rgba(148,163,184,.4)" }}
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
                className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
                style={{
                  color: "rgba(148,163,184,.45)",
                  fontFamily: "'Rajdhani',sans-serif",
                  letterSpacing: "0.2em",
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
