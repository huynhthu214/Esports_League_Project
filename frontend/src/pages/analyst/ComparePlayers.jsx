import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Radar, Line } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
);

const STYLE = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(167,139,250,.2); border-top-color:#a78bfa; width:18px; height:18px; display:inline-block; }
`;

const METRICS = [
  { key: "avg_kills", label: "Kills TB", low: false },
  { key: "avg_deaths", label: "Deaths TB", low: true },
  { key: "avg_assists", label: "Assists TB", low: false },
  { key: "win_rate", label: "Win Rate (%)", low: false },
  { key: "survivability", label: "Survivability", low: false },
];

const ComparePlayers = () => {
  const [mode, setMode] = useState("players"); // players | teams
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [externalStatus, setExternalStatus] = useState(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [result, setResult] = useState([]);
  const [ts1, setTs1] = useState([]);
  const [ts2, setTs2] = useState([]);
  const [trendMetric, setTrendMetric] = useState("gold"); // gold | kda
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient
      .get("/admin/players")
      .then((r) => setPlayers(r.data?.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/teams")
      .then((r) => setTeams(r.data?.data || []))
      .catch(() => {});
    axiosClient
      .get("/analytics/external/status")
      .then((r) => setExternalStatus(r.data))
      .catch(() => {});
  }, []);

  const handleCompare = () => {
    if (!p1 || !p2 || p1 === p2) {
      setError("Chọn 2 tuyển thủ khác nhau.");
      return;
    }
    setLoading(true);
    setError("");
    setResult([]);
    setTs1([]);
    setTs2([]);
    axiosClient
      .get("/analytics/compare", { params: { p1, p2 } })
      .then((r) => {
        const rows = Array.isArray(r.data) ? r.data : [];
        const ids = new Set(rows.map((x) => String(x?._id)));
        const missing = [p1, p2].filter((id) => !ids.has(String(id)));

        if (rows.length === 0) {
          setError("Không có dữ liệu cho 2 tuyển thủ này.");
          return;
        }
        if (missing.length > 0) {
          setError(
            `Thiếu dữ liệu cho: ${missing.join(
              ", ",
            )}. Hãy nhập match_stats cho tuyển thủ này trước.`,
          );
          setResult(rows);
          return;
        }
        setResult(rows);
      })
      .catch(() => setError("Không tải được dữ liệu so sánh."))
      .finally(() => setLoading(false));

    Promise.all([
      axiosClient.get(`/analytics/players/${p1}/timeseries`, {
        params: { limit: 10 },
      }),
      axiosClient.get(`/analytics/players/${p2}/timeseries`, {
        params: { limit: 10 },
      }),
    ])
      .then(([a, b]) => {
        setTs1(a.data?.data || []);
        setTs2(b.data?.data || []);
      })
      .catch(() => {});
  };

  const handleCompareTeams = () => {
    if (!p1 || !p2 || p1 === p2) {
      setError("Chọn 2 đội khác nhau.");
      return;
    }
    setLoading(true);
    setError("");
    setResult([]);
    setTs1([]);
    setTs2([]);
    axiosClient
      .get("/analytics/compare-teams", { params: { team1: p1, team2: p2 } })
      .then((r) => {
        const rows = Array.isArray(r.data) ? r.data : [];
        if (rows.length === 0) setError("Không có dữ liệu cho 2 đội này.");
        else setResult(rows);
      })
      .catch(() => setError("Không tải được dữ liệu so kèo đội."))
      .finally(() => setLoading(false));
  };

  const d1 = result.find((r) => String(r._id) === String(p1)) || {};
  const d2 = result.find((r) => String(r._id) === String(p2)) || {};
  const p1info =
    mode === "players"
      ? players.find((p) => p.PlayerID === p1) || {}
      : teams.find((t) => t.TeamID === p1) || {};
  const p2info =
    mode === "players"
      ? players.find((p) => p.PlayerID === p2) || {}
      : teams.find((t) => t.TeamID === p2) || {};
  const better = (key, low) => {
    const v1 = d1[key] || 0,
      v2 = d2[key] || 0;
    if (low) return v1 < v2 ? 1 : v2 < v1 ? 2 : 0;
    return v1 > v2 ? 1 : v2 > v1 ? 2 : 0;
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] w-full relative overflow-x-hidden text-slate-200 font-sans"
      style={{
        background: "#080c16",
      }}
    >
      <style>{STYLE}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(167,139,250,.1) 0%,transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto p-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(167,139,250,.7)" }}
            >
              Phân tích
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-1">
            So Kèo Trực Diện
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            So sánh trực tiếp 2 tuyển thủ hoặc 2 đội tuyển dựa trên dữ liệu
          </p>
        </div>

        {/* Mode tabs */}
        <div className="fade-up mb-4 flex gap-2">
          {[
            ["players", "Tuyển thủ"],
            ["teams", "Đội tuyển"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => {
                setMode(k);
                setP1("");
                setP2("");
                setResult([]);
                setTs1([]);
                setTs2([]);
                setError("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all"
              style={{
                background:
                  mode === k ? "rgba(167,139,250,.12)" : "rgba(0,0,0,.15)",
                border:
                  mode === k
                    ? "1px solid rgba(167,139,250,.35)"
                    : "1px solid rgba(148,163,184,.15)",
                color: mode === k ? "#a78bfa" : "rgba(148,163,184,.7)",
                fontSize: "0.68rem",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="fade-up rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(167,139,250,.15)",
          }}
        >
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {[
              [
                p1,
                setP1,
                "#38bdf8",
                mode === "players" ? "Tuyển thủ 1" : "Đội tuyển 1",
              ],
              [
                p2,
                setP2,
                "#f87171",
                mode === "players" ? "Tuyển thủ 2" : "Đội tuyển 2",
              ],
            ].map(([val, set, color, label]) => (
              <div key={label}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color }}
                >
                  {label}
                </div>
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "rgba(0,0,0,.4)",
                    border: `1px solid ${color}30`,
                    color,
                  }}
                >
                  <option value="">-- Chọn --</option>
                  {(mode === "players" ? players : teams).map((x) => (
                    <option
                      key={mode === "players" ? x.PlayerID : x.TeamID}
                      value={mode === "players" ? x.PlayerID : x.TeamID}
                    >
                      {mode === "players"
                        ? `${x.Nickname} · ${x.Position}`
                        : `${x.ShortName || x.TeamID} — ${x.TeamName}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={mode === "players" ? handleCompare : handleCompareTeams}
            disabled={loading || !p1 || !p2}
            className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              boxShadow: "0 0 18px rgba(167,139,250,.3)",
            }}
          >
            {loading ? <span className="spinner" /> : "So Sánh"}
          </button>
        </div>
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
        {result.length > 0 && (
          <div
            className="fade-up rounded-2xl overflow-hidden"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(167,139,250,.1)",
            }}
          >
            <div
              className="grid grid-cols-3 text-center py-4 px-5"
              style={{ borderBottom: "1px solid rgba(167,139,250,.1)" }}
            >
              <div className="font-black text-sm" style={{ color: "#38bdf8" }}>
                {mode === "players"
                  ? p1info.Nickname || p1
                  : p1info.ShortName || p1info.TeamName || p1}
              </div>
              <div
                className="text-xs font-bold uppercase tracking-widest self-center"
                style={{ color: "rgba(148,163,184,.4)" }}
              >
                VS
              </div>
              <div className="font-black text-sm" style={{ color: "#f87171" }}>
                {mode === "players"
                  ? p2info.Nickname || p2
                  : p2info.ShortName || p2info.TeamName || p2}
              </div>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-5">
              {/* Radar chart */}
              <div
                className="rounded-2xl p-4"
                style={{ border: "1px solid rgba(167,139,250,.12)" }}
              >
                <div
                  className="text-xs font-black uppercase tracking-widest mb-3"
                  style={{ color: "rgba(148,163,184,.55)" }}
                >
                  Radar — Snapshot
                </div>
                <Radar
                  data={{
                    labels: METRICS.map((m) => m.label),
                    datasets: [
                      {
                        label:
                          mode === "players"
                            ? p1info.Nickname || p1
                            : p1info.ShortName || p1,
                        data: METRICS.map((m) => Number(d1[m.key] || 0)),
                        borderColor: "rgba(56,189,248,.9)",
                        backgroundColor: "rgba(56,189,248,.12)",
                        pointBackgroundColor: "rgba(56,189,248,.9)",
                      },
                      {
                        label:
                          mode === "players"
                            ? p2info.Nickname || p2
                            : p2info.ShortName || p2,
                        data: METRICS.map((m) => Number(d2[m.key] || 0)),
                        borderColor: "rgba(248,113,113,.9)",
                        backgroundColor: "rgba(248,113,113,.12)",
                        pointBackgroundColor: "rgba(248,113,113,.9)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { labels: { color: "rgba(226,232,240,.85)" } },
                    },
                    scales: {
                      r: {
                        angleLines: { color: "rgba(148,163,184,.12)" },
                        grid: { color: "rgba(148,163,184,.10)" },
                        pointLabels: { color: "rgba(226,232,240,.75)" },
                        ticks: {
                          color: "rgba(148,163,184,.55)",
                          backdropColor: "transparent",
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Trend chart (players only) */}
              <div
                className="rounded-2xl p-4"
                style={{ border: "1px solid rgba(167,139,250,.12)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: "rgba(148,163,184,.55)" }}
                  >
                    Line — Trend (10 trận gần nhất)
                  </div>
                  <select
                    value={trendMetric}
                    onChange={(e) => setTrendMetric(e.target.value)}
                    className="text-xs font-bold rounded-lg px-3 py-2 outline-none"
                    style={{
                      background: "rgba(0,0,0,.25)",
                      border: "1px solid rgba(148,163,184,.15)",
                      color: "rgba(226,232,240,.9)",
                    }}
                    disabled={mode !== "players"}
                  >
                    <option value="gold">Gold</option>
                    <option value="kda">KDA</option>
                  </select>
                </div>

                {mode !== "players" ? (
                  <div
                    className="text-sm py-10 text-center"
                    style={{ color: "rgba(148,163,184,.5)" }}
                  >
                    Trend chart hiện hỗ trợ cho tuyển thủ (player timeseries).
                  </div>
                ) : (
                  <Line
                    data={{
                      labels: (ts1.length ? ts1 : ts2).map((x) =>
                        x.match_date
                          ? new Date(x.match_date).toLocaleDateString("vi-VN")
                          : x.match_id || "",
                      ),
                      datasets: [
                        {
                          label: p1info.Nickname || p1,
                          data: ts1.map((x) =>
                            trendMetric === "gold" ? x.gold : x.kda,
                          ),
                          borderColor: "rgba(56,189,248,.9)",
                          backgroundColor: "rgba(56,189,248,.12)",
                          tension: 0.35,
                        },
                        {
                          label: p2info.Nickname || p2,
                          data: ts2.map((x) =>
                            trendMetric === "gold" ? x.gold : x.kda,
                          ),
                          borderColor: "rgba(248,113,113,.9)",
                          backgroundColor: "rgba(248,113,113,.12)",
                          tension: 0.35,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { labels: { color: "rgba(226,232,240,.85)" } },
                      },
                      scales: {
                        x: {
                          ticks: { color: "rgba(148,163,184,.6)" },
                          grid: { color: "rgba(148,163,184,.10)" },
                        },
                        y: {
                          ticks: { color: "rgba(148,163,184,.6)" },
                          grid: { color: "rgba(148,163,184,.10)" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Numbers (kept) */}
            <div>
              {METRICS.map((m) => {
                const v1 = d1[m.key] || 0,
                  v2 = d2[m.key] || 0,
                  b = better(m.key, m.low),
                  max = Math.max(v1, v2, 1);
                return (
                  <div
                    key={m.key}
                    className="grid grid-cols-3 items-center px-5 py-4 gap-4"
                    style={{ borderTop: "1px solid rgba(167,139,250,.05)" }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className="font-black text-sm"
                        style={{
                          color: b === 1 ? "#34d399" : "rgba(148,163,184,.6)",
                        }}
                      >
                        {Number(v1).toFixed(1)}
                        {b === 1 ? " ✓" : ""}
                      </span>
                      <div
                        className="w-20 h-2 rounded-full"
                        style={{ background: "rgba(255,255,255,.05)" }}
                      >
                        <div
                          className="h-full rounded-full ml-auto"
                          style={{
                            width: `${(v1 / max) * 100}%`,
                            background: b === 1 ? "#34d399" : "#38bdf8",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="text-center text-xs font-bold uppercase tracking-widest"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      {m.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-20 h-2 rounded-full"
                        style={{ background: "rgba(255,255,255,.05)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(v2 / max) * 100}%`,
                            background: b === 2 ? "#34d399" : "#f87171",
                          }}
                        />
                      </div>
                      <span
                        className="font-black text-sm"
                        style={{
                          color: b === 2 ? "#34d399" : "rgba(148,163,184,.6)",
                        }}
                      >
                        {b === 2 ? "✓ " : ""}
                        {Number(v2).toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ComparePlayers;
