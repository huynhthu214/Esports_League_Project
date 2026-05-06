import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(251,146,60,.2); border-top-color:#fb923c; width:18px; height:18px; display:inline-block; }
`;

const TeamH2H = () => {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient
      .get("/admin/teams")
      .then((r) => setTeams(r.data?.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (!team1 || !team2 || team1 === team2) {
      setError("Chọn 2 đội khác nhau.");
      return;
    }
    setLoading(true);
    setError("");
    setMatches([]);
    axiosClient
      .get("/analytics/h2h", { params: { team1, team2 } })
      .then((r) => {
        const d = r.data;
        if (!d?.length) setError("Chưa có lịch sử đối đầu giữa 2 đội này.");
        else setMatches(d);
      })
      .catch(() => setError("Không tải được dữ liệu H2H."))
      .finally(() => setLoading(false));
  };

  const win1 = matches.filter(
    (m) => m.teams?.find((t) => t.team_id === team1)?.result === "WIN",
  ).length;
  const win2 = matches.filter(
    (m) => m.teams?.find((t) => t.team_id === team2)?.result === "WIN",
  ).length;
  const t1info = teams.find((t) => t.TeamID === team1) || {};
  const t2info = teams.find((t) => t.TeamID === team2) || {};

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
              "linear-gradient(rgba(251,146,60,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(251,146,60,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[400px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(251,146,60,.1) 0%,transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(251,146,60,.7)" }}
            >
              MongoDB · 10 trận gần nhất
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            🥊 Đối Đầu H2H
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>  
          </p>
        </div>
        <div
          className="fade-up rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(251,146,60,.15)",
          }}
        >
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {[
              [team1, setTeam1, "#38bdf8", "Đội 1"],
              [team2, setTeam2, "#f87171", "Đội 2"],
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
                  <option value="">-- Chọn đội --</option>
                  {teams.map((t) => (
                    <option key={t.TeamID} value={t.TeamID}>
                      {t.ShortName} — {t.TeamName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !team1 || !team2}
            className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#c2410c,#fb923c)",
              boxShadow: "0 0 18px rgba(251,146,60,.3)",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.7rem",
            }}
          >
            {loading ? <span className="spinner" /> : "Xem H2H"}
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
        {matches.length > 0 && (
          <>
            {/* Tổng kết */}
            <div
              className="fade-up rounded-2xl p-5 mb-4 grid grid-cols-3 text-center"
              style={{
                background: "rgba(13,17,30,.9)",
                border: "1px solid rgba(251,146,60,.15)",
              }}
            >
              <div>
                <div
                  className="text-3xl font-black"
                  style={{
                    color: "#38bdf8",
                    fontFamily: "'Orbitron',monospace",
                  }}
                >
                  {win1}
                </div>
                <div className="text-sm font-bold text-white">
                  {t1info.ShortName || team1}
                </div>
              </div>
              <div className="self-center">
                <div
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "rgba(148,163,184,.4)" }}
                >
                  Thắng — Thua
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "rgba(148,163,184,.6)" }}
                >
                  {matches.length} trận
                </div>
              </div>
              <div>
                <div
                  className="text-3xl font-black"
                  style={{
                    color: "#f87171",
                    fontFamily: "'Orbitron',monospace",
                  }}
                >
                  {win2}
                </div>
                <div className="text-sm font-bold text-white">
                  {t2info.ShortName || team2}
                </div>
              </div>
            </div>
            {/* Danh sách trận */}
            <div className="fade-up flex flex-col gap-3">
              {matches.map((m, i) => {
                const td1 = m.teams?.find((t) => t.team_id === team1) || {};
                const td2 = m.teams?.find((t) => t.team_id === team2) || {};
                const winner = td1.result === "WIN" ? team1 : team2;
                return (
                  <div
                    key={m.match_id || i}
                    className="rounded-xl px-5 py-4 flex items-center gap-4"
                    style={{
                      background: "rgba(13,17,30,.9)",
                      border: `1px solid ${winner === team1 ? "rgba(56,189,248,.15)" : "rgba(248,113,113,.15)"}`,
                    }}
                  >
                    <div className="flex-1 text-right">
                      <div
                        className="font-black text-sm"
                        style={{
                          color: td1.result === "WIN" ? "#34d399" : "#94a3b8",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {t1info.ShortName || team1}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(148,163,184,.4)" }}
                      >
                        K: {td1.total_kills || 0} · G:{" "}
                        {(td1.total_gold || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className="text-xs font-black px-3 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(251,146,60,.1)",
                          color: "#fb923c",
                          border: "1px solid rgba(251,146,60,.2)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {td1.score || "?"} — {td2.score || "?"}
                      </div>
                      {m.match_date && (
                        <div
                          className="text-xs mt-1"
                          style={{ color: "rgba(148,163,184,.35)" }}
                        >
                          {new Date(m.match_date).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-black text-sm"
                        style={{
                          color: td2.result === "WIN" ? "#34d399" : "#94a3b8",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {t2info.ShortName || team2}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(148,163,184,.4)" }}
                      >
                        K: {td2.total_kills || 0} · G:{" "}
                        {(td2.total_gold || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default TeamH2H;
