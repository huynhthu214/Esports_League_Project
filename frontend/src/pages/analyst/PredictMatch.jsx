import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fill { from{width:0} }
  .fade-up { animation: fadeUp .4s ease both; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(56,189,248,.2); border-top-color:#38bdf8; width:18px; height:18px; display:inline-block; }
`;

const PredictMatch = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      axiosClient.get("/admin/seasons"),
      axiosClient.get("/admin/teams"),
    ])
      .then(([sr, tr]) => {
        const list = sr.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSeasonId(active.SeasonID);
        setTeams(tr.data?.data || []);
      })
      .catch(() => {});
  }, []);

  const handlePredict = () => {
    if (!team1 || !team2 || !seasonId || team1 === team2) {
      setError("Chọn 2 đội khác nhau và mùa giải.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    axiosClient
      .get("/analytics/predict", { params: { team1, team2, seasonId } })
      .then((r) => setResult(r.data))
      .catch(() =>
        setError(
          "Không tải được dữ liệu dự đoán. Kiểm tra SQL + MongoDB đang chạy.",
        ),
      )
      .finally(() => setLoading(false));
  };

  const winnerColor =
    result?.prediction === (result?.team1?.name || result?.team1?.id)
      ? "#38bdf8"
      : "#f87171";

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
              "linear-gradient(rgba(56,189,248,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(56,189,248,.08) 0%,transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(56,189,248,.7)" }}
            >
              SQL + MongoDB
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            🔮 Dự Đoán Trận Đấu
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Dự đoán dựa trên Win Rate SQL (50%) + Điểm (30%) + Form MongoDB
            (20%).
          </p>
        </div>
        <div
          className="fade-up rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(56,189,248,.15)",
          }}
        >
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none col-span-1"
              style={{
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(167,139,250,.3)",
                color: "#a78bfa",
                fontFamily: "'Orbitron',monospace",
                fontSize: "0.7rem",
              }}
            >
              <option value="">-- Mùa giải --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName}
                </option>
              ))}
            </select>
            {[
              [team1, setTeam1, "#38bdf8", "Đội 1"],
              [team2, setTeam2, "#f87171", "Đội 2"],
            ].map(([val, set, color, label]) => (
              <select
                key={label}
                value={val}
                onChange={(e) => set(e.target.value)}
                className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background: "rgba(0,0,0,.4)",
                  border: `1px solid ${color}30`,
                  color,
                  fontFamily: "'Orbitron',monospace",
                  fontSize: "0.7rem",
                }}
              >
                <option value="">-- {label} --</option>
                {teams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.ShortName}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <button
            onClick={handlePredict}
            disabled={loading || !team1 || !team2 || !seasonId}
            className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#0369a1,#38bdf8)",
              boxShadow: "0 0 18px rgba(56,189,248,.3)",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.7rem",
            }}
          >
            {loading ? <span className="spinner" /> : "🔮 Dự Đoán"}
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
        {result && (
          <>
            {/* Kết quả dự đoán */}
            <div
              className="fade-up rounded-2xl p-6 mb-4 text-center relative overflow-hidden"
              style={{
                background: "rgba(13,17,30,.9)",
                border: `2px solid ${winnerColor}40`,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  background: `radial-gradient(circle at 50% 0%,${winnerColor},transparent 60%)`,
                }}
              />
              <div
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Dự đoán thắng
              </div>
              <div
                className="text-4xl font-black mb-1"
                style={{
                  color: winnerColor,
                  fontFamily: "'Orbitron',monospace",
                }}
              >
                {result.prediction}
              </div>
              <div
                className="text-sm"
                style={{ color: "rgba(148,163,184,.6)" }}
              >
                Độ tự tin:{" "}
                <span
                  style={{
                    color:
                      result.confidence > 60
                        ? "#34d399"
                        : result.confidence > 40
                          ? "#fbbf24"
                          : "#f87171",
                    fontWeight: 700,
                  }}
                >
                  {result.confidence}%
                </span>
              </div>
            </div>
            {/* So sánh 2 đội */}
            <div
              className="fade-up rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,17,30,.9)",
                border: "1px solid rgba(56,189,248,.1)",
              }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-3 text-center py-4"
                style={{ borderBottom: "1px solid rgba(56,189,248,.08)" }}
              >
                <div
                  className="font-black"
                  style={{
                    color: "#38bdf8",
                    fontFamily: "'Orbitron',monospace",
                  }}
                >
                  {result.team1.name}
                </div>
                <div
                  className="text-xs uppercase tracking-widest self-center"
                  style={{ color: "rgba(148,163,184,.4)" }}
                >
                  Chỉ số
                </div>
                <div
                  className="font-black"
                  style={{
                    color: "#f87171",
                    fontFamily: "'Orbitron',monospace",
                  }}
                >
                  {result.team2.name}
                </div>
              </div>
              {/* Win Prob bar */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid rgba(56,189,248,.05)" }}
              >
                <div
                  className="text-xs uppercase tracking-widest text-center mb-2"
                  style={{ color: "rgba(148,163,184,.4)" }}
                >
                  Xác suất thắng
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div
                    className="transition-all duration-700"
                    style={{
                      width: `${result.team1.win_prob}%`,
                      background: "#38bdf8",
                    }}
                  />
                  <div className="flex-1" style={{ background: "#f87171" }} />
                </div>
                <div
                  className="flex justify-between text-xs font-black mt-1"
                  style={{ fontFamily: "'Orbitron',monospace" }}
                >
                  <span style={{ color: "#38bdf8" }}>
                    {result.team1.win_prob}%
                  </span>
                  <span style={{ color: "#f87171" }}>
                    {result.team2.win_prob}%
                  </span>
                </div>
              </div>
              {/* Stats rows */}
              {[
                {
                  label: "Thắng / Thua",
                  v1: `${result.team1.wins}W ${result.team1.losses}L`,
                  v2: `${result.team2.wins}W ${result.team2.losses}L`,
                },
                {
                  label: "Win Rate SQL",
                  v1: `${(result.team1.win_rate || 0).toFixed(1)}%`,
                  v2: `${(result.team2.win_rate || 0).toFixed(1)}%`,
                },
                {
                  label: "Form gần nhất",
                  v1: `${result.team1.recent_wins}/${result.team1.recent_matches}`,
                  v2: `${result.team2.recent_wins}/${result.team2.recent_matches}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 text-center px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(56,189,248,.04)" }}
                >
                  <div className="font-bold text-sm text-white">{row.v1}</div>
                  <div
                    className="text-xs uppercase tracking-widest self-center"
                    style={{ color: "rgba(148,163,184,.4)" }}
                  >
                    {row.label}
                  </div>
                  <div className="font-bold text-sm text-white">{row.v2}</div>
                </div>
              ))}
              <div
                className="px-5 py-3 text-xs text-center"
                style={{ color: "rgba(148,163,184,.3)" }}
              >
                {result.note}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default PredictMatch;
