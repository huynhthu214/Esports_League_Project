import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
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
  const [players, setPlayers] = useState([]);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient
      .get("/admin/players")
      .then((r) => setPlayers(r.data?.data || []))
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
    axiosClient
      .get("/analytics/compare", { params: { p1, p2 } })
      .then((r) => {
        if (!r.data?.length)
          setError("Không có dữ liệu MongoDB cho 2 tuyển thủ này.");
        else setResult(r.data);
      })
      .catch(() => setError("Không tải được dữ liệu so sánh."))
      .finally(() => setLoading(false));
  };

  const d1 = result.find((r) => r._id === p1) || {};
  const d2 = result.find((r) => r._id === p2) || {};
  const p1info = players.find((p) => p.PlayerID === p1) || {};
  const p2info = players.find((p) => p.PlayerID === p2) || {};
  const better = (key, low) => {
    const v1 = d1[key] || 0,
      v2 = d2[key] || 0;
    if (low) return v1 < v2 ? 1 : v2 < v1 ? 2 : 0;
    return v1 > v2 ? 1 : v2 > v1 ? 2 : 0;
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#080c16",
        fontFamily: "'Rajdhani','Segoe UI',sans-serif",
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(167,139,250,.7)" }}
            >
              MongoDB
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            ⚖️ So Sánh Tuyển Thủ
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            So sánh hiệu suất 2 tuyển thủ từ match_stats.
          </p>
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
              [p1, setP1, "#38bdf8", "Tuyển thủ 1"],
              [p2, setP2, "#f87171", "Tuyển thủ 2"],
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
                    fontFamily: "'Orbitron',monospace",
                    fontSize: "0.72rem",
                  }}
                >
                  <option value="">-- Chọn --</option>
                  {players.map((p) => (
                    <option key={p.PlayerID} value={p.PlayerID}>
                      {p.Nickname} · {p.Position}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !p1 || !p2}
            className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              boxShadow: "0 0 18px rgba(167,139,250,.3)",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.7rem",
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
        {result.length === 2 && (
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
              <div
                className="font-black text-sm"
                style={{ color: "#38bdf8", fontFamily: "'Orbitron',monospace" }}
              >
                {p1info.Nickname || p1}
              </div>
              <div
                className="text-xs font-bold uppercase tracking-widest self-center"
                style={{ color: "rgba(148,163,184,.4)" }}
              >
                VS
              </div>
              <div
                className="font-black text-sm"
                style={{ color: "#f87171", fontFamily: "'Orbitron',monospace" }}
              >
                {p2info.Nickname || p2}
              </div>
            </div>
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
                    style={{ borderBottom: "1px solid rgba(167,139,250,.05)" }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className="font-black text-sm"
                        style={{
                          color: b === 1 ? "#34d399" : "rgba(148,163,184,.6)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {v1.toFixed(1)}
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
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {b === 2 ? "✓ " : ""}
                        {v2.toFixed(1)}
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
