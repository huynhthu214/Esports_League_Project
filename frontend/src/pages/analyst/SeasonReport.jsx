import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(251,191,36,.2); border-top-color:#fbbf24; width:18px; height:18px; display:inline-block; }
`;

const SeasonReport = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = (sid) => {
    setLoading(true);
    setError("");
    setReport(null);
    axiosClient
      .get(`/analytics/reports/season/${sid}`)
      .then((r) => setReport(r.data))
      .catch(() => setError("Không tải được báo cáo. Kiểm tra SQL + MongoDB."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) {
          setSeasonId(active.SeasonID);
          fetchReport(active.SeasonID);
        } else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleSeasonChange = (e) => {
    setSeasonId(e.target.value);
    fetchReport(e.target.value);
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
              "linear-gradient(rgba(251,191,36,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 right-1/4 w-[400px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(251,191,36,.08) 0%,transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(251,191,36,.7)" }}
            >
              SQL + MongoDB
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            📋 Báo Cáo Mùa Giải
          </h1>
        </div>
        <div className="fade-up flex gap-3 mb-6 flex-wrap items-center">
          <select
            value={seasonId}
            onChange={handleSeasonChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(251,191,36,.25)",
              color: "#fbbf24",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.72rem",
            }}
          >
            <option value="">-- Chọn mùa giải --</option>
            {seasons.map((s) => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.SeasonName}
              </option>
            ))}
          </select>
          {loading && (
            <div className="flex items-center gap-2">
              <span className="spinner" />
              <span
                className="text-xs"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Đang tải...
              </span>
            </div>
          )}
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
        {report && (
          <>
            {/* Source badges */}
            <div className="fade-up flex gap-2 mb-5 flex-wrap">
              <span
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(56,189,248,.12)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56,189,248,.25)",
                }}
              >
                🗄️ SQL Server — Standings & KDA
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(52,211,153,.12)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,.25)",
                }}
              >
                🍃 MongoDB — Trận đấu & Tướng
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(251,191,36,.12)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,.25)",
                }}
              >
                ⚡ Mongo match_stats: {report.total_matches_mongo}
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(56,189,248,.10)",
                  color: "rgba(226,232,240,.85)",
                  border: "1px solid rgba(148,163,184,.18)",
                }}
              >
                🧾 SQL Matches: {report.total_matches_sql ?? 0}
              </span>
            </div>

            {/* Consistency Check (Multi-DB highlight) */}
            {(() => {
              const sqlCount = Number(report.total_matches_sql ?? 0);
              const mongoCount = Number(report.total_matches_mongo ?? 0);
              const delta = mongoCount - sqlCount;
              const ok = delta === 0;
              return (
                <div
                  className="fade-up mb-5 px-5 py-4 rounded-2xl"
                  style={{
                    background: ok
                      ? "rgba(52,211,153,.06)"
                      : "rgba(248,113,113,.06)",
                    border: ok
                      ? "1px solid rgba(52,211,153,.18)"
                      : "1px solid rgba(248,113,113,.18)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div
                        className="text-xs font-black uppercase tracking-[0.25em]"
                        style={{
                          color: ok
                            ? "rgba(52,211,153,.9)"
                            : "rgba(248,113,113,.9)",
                          fontFamily: "'Orbitron',monospace",
                          fontSize: "0.68rem",
                        }}
                      >
                        Multi-DB Consistency Check
                      </div>
                      <div
                        className="text-sm mt-1"
                        style={{ color: "rgba(226,232,240,.9)" }}
                      >
                        So sánh dữ liệu vận hành (SQL) và dữ liệu raw/analytics
                        (MongoDB) cho cùng 1 mùa giải.
                      </div>
                    </div>
                    <div
                      className="text-sm font-black"
                      style={{
                        color: ok ? "#34d399" : "#f87171",
                        fontFamily: "'Orbitron',monospace",
                      }}
                    >
                      {ok ? "OK" : `Δ ${delta > 0 ? "+" : ""}${delta}`}
                    </div>
                  </div>

                  <div
                    className="mt-3 text-xs"
                    style={{ color: "rgba(148,163,184,.65)" }}
                  >
                    {ok
                      ? "Hai nguồn khớp nhau → pipeline đồng bộ dữ liệu ổn định."
                      : "Chênh lệch thường do: match chưa ghi vào SQL hoặc chưa ingest vào MongoDB. Đây là điểm nổi bật của hệ đa DB: có thể giám sát và phát hiện lệch dữ liệu."}
                  </div>
                </div>
              );
            })()}

            <div className="grid lg:grid-cols-2 gap-5">
              {/* Standings */}
              <div
                className="fade-up d1 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(251,146,60,.12)",
                }}
              >
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(251,146,60,.08)" }}
                >
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#fb923c" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron',monospace" }}
                  >
                    Bảng Xếp Hạng
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {(report.standings || []).map((t, i) => (
                    <div
                      key={t.ShortName || i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[.02] transition-colors"
                    >
                      <div
                        className="w-6 font-black text-xs text-center"
                        style={{
                          color:
                            i === 0
                              ? "#fbbf24"
                              : i === 1
                                ? "#94a3b8"
                                : i === 2
                                  ? "#cd7c3b"
                                  : "rgba(148,163,184,.4)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {i === 0
                          ? "🥇"
                          : i === 1
                            ? "🥈"
                            : i === 2
                              ? "🥉"
                              : `#${t.Standing_Rank}`}
                      </div>
                      <div className="flex-1">
                        <div
                          className="font-black text-sm text-white"
                          style={{ fontFamily: "'Orbitron',monospace" }}
                        >
                          {t.ShortName}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.5)" }}
                        >
                          {t.Wins}W — {t.Losses}L · {t.Points}pts
                        </div>
                      </div>
                      <div
                        className="font-bold text-sm"
                        style={{
                          color:
                            t.WinRate >= 60
                              ? "#34d399"
                              : t.WinRate >= 40
                                ? "#94a3b8"
                                : "#f87171",
                        }}
                      >
                        {Number(t.WinRate).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  {!report.standings?.length && (
                    <div
                      className="text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              {/* Top Players */}
              <div
                className="fade-up d2 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(167,139,250,.12)",
                }}
              >
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(167,139,250,.08)" }}
                >
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#a78bfa" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron',monospace" }}
                  >
                    Top KDA
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {(report.top_players || []).map((p, i) => (
                    <div
                      key={p.Nickname || i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[.02] transition-colors"
                    >
                      <div
                        className="w-6 font-black text-xs text-center"
                        style={{
                          color: i === 0 ? "#fbbf24" : "rgba(148,163,184,.4)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {i === 0 ? "👑" : `#${p.KDA_Rank}`}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">
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
                        className="font-black text-sm"
                        style={{
                          color: "#a78bfa",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {Number(p.AvgKDA).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {!report.top_players?.length && (
                    <div
                      className="text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              {/* Top Heroes */}
              <div
                className="fade-up d3 lg:col-span-2 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(52,211,153,.12)",
                }}
              >
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(52,211,153,.08)" }}
                >
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#34d399" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron',monospace" }}
                  >
                    🍃 Top Tướng (MongoDB)
                  </span>
                </div>
                <div className="p-4 grid sm:grid-cols-5 gap-3">
                  {(report.top_heroes || []).map((h, i) => (
                    <div
                      key={h._id || i}
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: "rgba(52,211,153,.06)",
                        border: "1px solid rgba(52,211,153,.15)",
                      }}
                    >
                      <div
                        className="font-black text-xs mb-1 truncate text-white"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {h._id || "?"}
                      </div>
                      <div
                        className="text-lg font-black"
                        style={{ color: "#34d399" }}
                      >
                        {h.pick_count}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        lần pick
                      </div>
                    </div>
                  ))}
                  {!report.top_heroes?.length && (
                    <div
                      className="sm:col-span-5 text-sm text-center py-6"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Chưa có dữ liệu tướng trong MongoDB
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SeasonReport;
