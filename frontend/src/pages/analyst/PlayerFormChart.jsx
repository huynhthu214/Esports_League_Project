import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes radarIn { from{opacity:0;transform:scale(0.7);transform-origin:center center} to{opacity:1;transform:scale(1)} }
  @keyframes dotPulse { 0%,100%{r:4;opacity:.8} 50%{r:5.5;opacity:1} }
  @keyframes strokeDraw { from{stroke-dashoffset:800} to{stroke-dashoffset:0} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s} .d3{animation-delay:.15s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(56,189,248,.2); border-top-color:#38bdf8; width:18px; height:18px; display:inline-block; }
  .radar-fill { animation: radarIn .7s cubic-bezier(.34,1.56,.64,1) .2s both; }
  .radar-stroke { stroke-dasharray:800; animation: strokeDraw .9s ease .3s both; }
  .radar-dot { animation: dotPulse 2.2s ease-in-out infinite; }
`;

/* ─── Helpers ─── */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate polygon point for radar.
 * axes: count of axes, index: 0-based, ratio: 0-1, radius: max radius
 * Starts from top (−90°), going clockwise.
 */
const radarPoint = (index, ratio, total, radius) => {
  const angle = toRad((360 / total) * index - 90);
  return {
    x: Math.cos(angle) * radius * ratio,
    y: Math.sin(angle) * radius * ratio,
  };
};

const pointsStr = (pts) => pts.map((p) => `${p.x},${p.y}`).join(" ");

/* ─── RadarChart SVG ─── */
const RadarChart = ({ stats }) => {
  const cx = 175;
  const cy = 175;
  const R = 130;
  const levels = 5;
  const total = 5;

  // Normalize each metric 0→1
  const axes = [
    {
      key: "kda",
      label: "KDA",
      value: stats.avg_kda || 0,
      max: 10,
      color: "#38bdf8",
      fmt: (v) => v.toFixed(2),
    },
    {
      key: "kills",
      label: "Kills",
      value: stats.avg_kills || 0,
      max: 15,
      color: "#34d399",
      fmt: (v) => v.toFixed(1),
    },
    {
      key: "assists",
      label: "Assists",
      value: stats.avg_assists || 0,
      max: 20,
      color: "#a78bfa",
      fmt: (v) => v.toFixed(1),
    },
    {
      key: "winrate",
      label: "Win Rate",
      value: parseFloat(stats.win_rate) || 0,
      max: 100,
      color: "#fbbf24",
      fmt: (v) => v.toFixed(0) + "%",
    },
    {
      key: "gold",
      label: "Gold",
      value: (stats.avg_gold || 0) / 1000,
      max: 20,
      color: "#fb923c",
      fmt: (v) => v.toFixed(1) + "k",
    },
  ];

  const ratios = axes.map((a) => Math.min(a.value / a.max, 1));

  // Grid pentagon points at each level
  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = (R * (lvl + 1)) / levels;
    return Array.from({ length: total }, (_, i) => radarPoint(i, 1, total, r));
  });

  // Data polygon
  const dataPts = axes.map((_, i) => radarPoint(i, ratios[i], total, R));

  // Label positions (slightly beyond R)
  const labelPts = axes.map((_, i) => radarPoint(i, 1, total, R + 24));

  // Value label positions (right next to each dot)
  const valuePts = axes.map((_, i) => radarPoint(i, ratios[i], total, R + 10));

  // Grid color
  const gridColor = "rgba(56,189,248,0.12)";
  const gridStroke = "rgba(56,189,248,0.18)";

  return (
    <svg
      viewBox={`0 0 350 350`}
      width="100%"
      style={{ maxWidth: 350, display: "block", margin: "0 auto" }}
      role="img"
      aria-label="Biểu đồ radar 5 chỉ số tuyển thủ"
    >
      <g transform={`translate(${cx},${cy})`}>
        {/* Grid rings */}
        {gridPolygons.map((pts, lvl) => (
          <polygon
            key={lvl}
            points={pointsStr(pts)}
            fill={lvl === levels - 1 ? "rgba(56,189,248,0.04)" : "none"}
            stroke={gridStroke}
            strokeWidth={0.7}
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const tip = radarPoint(i, 1, total, R);
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={tip.x}
              y2={tip.y}
              stroke="rgba(56,189,248,0.2)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Data fill */}
        <polygon
          className="radar-fill"
          points={pointsStr(dataPts)}
          fill="rgba(56,189,248,0.15)"
          stroke="none"
        />

        {/* Data stroke */}
        <polygon
          className="radar-stroke"
          points={pointsStr(dataPts)}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dots at each vertex */}
        {dataPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill={axes[i].color}
            className="radar-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}

        {/* Axis labels */}
        {axes.map((ax, i) => {
          const lp = labelPts[i];
          // Adjust anchor based on x position
          const anchor =
            Math.abs(lp.x) < 8 ? "middle" : lp.x > 0 ? "start" : "end";
          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y + 4}
              textAnchor={anchor}
              style={{
                fontSize: "11px",
                fontFamily: "'Rajdhani',sans-serif",
                fontWeight: 700,
                fill: ax.color,
                letterSpacing: "0.04em",
              }}
            >
              {ax.label}
            </text>
          );
        })}

        {/* Value labels */}
        {dataPts.map((p, i) => {
          if (ratios[i] < 0.05) return null;
          const vp = valuePts[i];
          const anchor =
            Math.abs(vp.x) < 6 ? "middle" : vp.x > 0 ? "start" : "end";
          return (
            <text
              key={i}
              x={vp.x}
              y={vp.y + 3}
              textAnchor={anchor}
              style={{
                fontSize: "9.5px",
                fontFamily: "'Orbitron',monospace",
                fontWeight: 700,
                fill: axes[i].color,
              }}
            >
              {axes[i].fmt(axes[i].value)}
            </text>
          );
        })}
      </g>
    </svg>
  );
};

/* ─── Stat bar ─── */
const Bar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-20 text-xs font-semibold text-right"
      style={{ color: "rgba(148,163,184,.6)" }}
    >
      {label}
    </div>
    <div
      className="flex-1 h-1.5 rounded-full"
      style={{ background: "rgba(255,255,255,.05)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color,
        }}
      />
    </div>
    <div
      className="w-12 text-xs font-black text-right"
      style={{ color, fontFamily: "'Orbitron',monospace" }}
    >
      {typeof value === "number" ? value.toFixed(2) : value}
    </div>
  </div>
);

/* ─── Stat mini card ─── */
const MiniStat = ({ label, value, color, sub }) => (
  <div
    className="rounded-xl px-3 py-2 flex flex-col gap-0.5"
    style={{
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.06)",
    }}
  >
    <div
      className="text-xs uppercase tracking-wider"
      style={{ color: "rgba(148,163,184,.5)" }}
    >
      {label}
    </div>
    <div
      className="text-lg font-black leading-tight"
      style={{ color, fontFamily: "'Orbitron',monospace" }}
    >
      {value}
    </div>
    {sub && (
      <div className="text-xs" style={{ color: "rgba(148,163,184,.35)" }}>
        {sub}
      </div>
    )}
  </div>
);

/* ─── Main Component ─── */
const PlayerFormChart = () => {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient
      .get("/admin/players")
      .then((r) => setPlayers(r.data?.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (!playerId) return;
    setLoading(true);
    setError("");
    setStats(null);
    axiosClient
      .get(`/analytics/players/${playerId}/form`)
      .then((r) => setStats(r.data))
      .catch(() =>
        setError(
          "Không tìm thấy dữ liệu. Tuyển thủ này chưa có trận nào trong MongoDB.",
        ),
      )
      .finally(() => setLoading(false));
  };

  const kdaColor = (v) => (v >= 5 ? "#34d399" : v >= 3 ? "#38bdf8" : "#f87171");

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#080c16",
        fontFamily: "'Rajdhani','Segoe UI',sans-serif",
      }}
    >
      <style>{STYLE}</style>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(56,189,248,.08) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(56,189,248,.7)" }}
            >
              MongoDB Aggregation · 50 trận
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            📈 Phong Độ Tuyển Thủ
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Phân tích hiệu suất 50 trận gần nhất từ MongoDB.
          </p>
        </div>

        {/* Selector */}
        <div
          className="fade-up rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(56,189,248,.15)",
          }}
        >
          <div className="flex gap-3 flex-wrap">
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="flex-1 min-w-[200px] text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
              style={{
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(56,189,248,.25)",
                color: "#38bdf8",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.72rem",
              }}
            >
              <option value="">-- Chọn tuyển thủ --</option>
              {players.map((p) => (
                <option key={p.PlayerID} value={p.PlayerID}>
                  {p.Nickname} · {p.Position} · {p.TeamShort || ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading || !playerId}
              className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-40 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
                boxShadow: "0 0 18px rgba(56,189,248,.3)",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.7rem",
              }}
            >
              {loading ? <span className="spinner" /> : "Phân Tích"}
            </button>
          </div>
          <p
            className="text-xs mt-2"
            style={{ color: "rgba(148,163,184,.35)" }}
          >
            Dữ liệu từ MongoDB{" "}
            <code style={{ color: "#a78bfa" }}>match_stats</code> — cần nhập kết
            quả trận trước.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="fade-up mb-5 px-5 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.25)",
              color: "#f87171",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {stats && (
          <>
            {/* ── Two-column layout: radar + stats ── */}
            <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Radar chart panel */}
              <div
                className="rounded-2xl p-5 flex flex-col"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(56,189,248,.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.2em]"
                    style={{ color: "rgba(56,189,248,.6)" }}
                  >
                    Biểu đồ mạng nhện · 5 chỉ số
                  </span>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                  {[
                    { label: "KDA", color: "#38bdf8" },
                    { label: "Kills", color: "#34d399" },
                    { label: "Assists", color: "#a78bfa" },
                    { label: "Win Rate", color: "#fbbf24" },
                    { label: "Gold", color: "#fb923c" },
                  ].map((l) => (
                    <span
                      key={l.label}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "rgba(148,163,184,.7)" }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: l.color,
                          display: "inline-block",
                        }}
                      />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* SVG Radar */}
                <RadarChart stats={stats} />
              </div>

              {/* Right panel: KDA + mini stats */}
              <div className="flex flex-col gap-3">
                {/* KDA Banner */}
                <div
                  className="rounded-2xl px-5 py-4 flex items-center gap-4"
                  style={{
                    background: "rgba(13,17,30,.9)",
                    border: `1px solid ${kdaColor(stats.avg_kda)}30`,
                  }}
                >
                  <div>
                    <div
                      className="text-xs uppercase tracking-widest mb-0.5"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      KDA Trung Bình
                    </div>
                    <div
                      className="text-5xl font-black"
                      style={{
                        color: kdaColor(stats.avg_kda),
                        fontFamily: "'Orbitron',monospace",
                      }}
                    >
                      {(stats.avg_kda || 0).toFixed(2)}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      {stats.avg_kda >= 5
                        ? "🏆 Xuất sắc"
                        : stats.avg_kda >= 3
                          ? "⚡ Tốt"
                          : "⚠️ Cần cải thiện"}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div
                      className="rounded-xl py-2.5 px-3"
                      style={{ background: "rgba(52,211,153,.07)" }}
                    >
                      <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        Trận
                      </div>
                      <div
                        className="text-xl font-black text-white"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {stats.total_matches}
                      </div>
                    </div>
                    <div
                      className="rounded-xl py-2.5 px-3"
                      style={{ background: "rgba(251,191,36,.07)" }}
                    >
                      <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        Win
                      </div>
                      <div
                        className="text-xl font-black"
                        style={{
                          color: "#fbbf24",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {stats.win_rate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini stat grid */}
                <div
                  className="rounded-2xl p-4 grid grid-cols-2 gap-2"
                  style={{
                    background: "rgba(13,17,30,.9)",
                    border: "1px solid rgba(56,189,248,.1)",
                  }}
                >
                  <MiniStat
                    label="Kills / trận"
                    value={(stats.avg_kills || 0).toFixed(2)}
                    color="#34d399"
                  />
                  <MiniStat
                    label="Deaths / trận"
                    value={(stats.avg_deaths || 0).toFixed(2)}
                    color="#f87171"
                  />
                  <MiniStat
                    label="Assists / trận"
                    value={(stats.avg_assists || 0).toFixed(2)}
                    color="#a78bfa"
                  />
                  <MiniStat
                    label="Gold (k) / trận"
                    value={((stats.avg_gold || 0) / 1000).toFixed(1) + "k"}
                    color="#fb923c"
                  />
                </div>
              </div>
            </div>

            {/* Stat bars */}
            <div
              className="fade-up d1 rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: "rgba(13,17,30,.9)",
                border: "1px solid rgba(56,189,248,.1)",
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: "rgba(148,163,184,.45)" }}
              >
                Chỉ số trung bình / trận
              </div>
              <Bar
                label="Kills"
                value={stats.avg_kills || 0}
                max={15}
                color="#34d399"
              />
              <Bar
                label="Deaths"
                value={stats.avg_deaths || 0}
                max={15}
                color="#f87171"
              />
              <Bar
                label="Assists"
                value={stats.avg_assists || 0}
                max={20}
                color="#a78bfa"
              />
              <Bar
                label="Gold (k)"
                value={(stats.avg_gold || 0) / 1000}
                max={20}
                color="#fb923c"
              />
              <Bar
                label="Win Rate"
                value={parseFloat(stats.win_rate) || 0}
                max={100}
                color="#fbbf24"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerFormChart;
