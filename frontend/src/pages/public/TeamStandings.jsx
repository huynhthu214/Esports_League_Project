import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

/* eslint-disable react-hooks/set-state-in-effect */

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(167,139,250,.2); border-top-color:#a78bfa; width:18px; height:18px; display:inline-block; }
`;

const RANK_STYLE = {
  1: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,.12)",
    border: "rgba(251,191,36,.3)",
  },
  2: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,.12)",
    border: "rgba(148,163,184,.3)",
  },
  3: {
    color: "#cd7c3b",
    bg: "rgba(205,124,59,.12)",
    border: "rgba(205,124,59,.3)",
  },
};

const TeamStandings = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeason, setLoadingSeason] = useState(true);
  const [error, setError] = useState("");

  // ── BƯỚC 1: Load danh sách mùa giải ─────────────────────────────
  const fetchSeasons = useCallback(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSeasonId(active.SeasonID);
      })
      .catch(() => setError("Không tải được danh sách mùa giải."))
      .finally(() => setLoadingSeason(false));
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // ── BƯỚC 2: Fetch standings mỗi khi seasonId thay đổi ───────────
  const fetchStandings = useCallback(() => {
    if (!seasonId) return;
    setLoading(true);
    setError("");
    setTeams([]);
    axiosClient
      .get("/admin/leaderboards/teams", { params: { seasonId } })
      .then((r) => setTeams(r.data?.data || []))
      .catch(() => setError("Không tải được bảng xếp hạng đội."))
      .finally(() => setLoading(false));
  }, [seasonId]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const maxWins = Math.max(...teams.map((t) => t.Wins || 0), 1);

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
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(167,139,250,.1) 0%,transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(56,189,248,.06) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(167,139,250,.7)" }}
            >
              Xếp Hạng Đội
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{
              fontFamily: "'Orbitron',monospace",
              textShadow: "0 0 30px rgba(167,139,250,.3)",
            }}
          >
            📊 Team Standings
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Xếp hạng theo Wins → Win Rate → Goal Difference (DENSE_RANK)
          </p>
        </div>

        {/* Season selector */}
        <div className="fade-up d1 flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            disabled={loadingSeason}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(167,139,250,.25)",
              color: "#a78bfa",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.75rem",
            }}
          >
            {loadingSeason ? (
              <option>Đang tải...</option>
            ) : seasons.length === 0 ? (
              <option value="">Chưa có mùa giải</option>
            ) : (
              seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} [{s.Status}]
                </option>
              ))
            )}
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

        {/* Error */}
        {error && (
          <div
            className="mb-5 px-5 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.25)",
              color: "#f87171",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Top 3 Podium */}
        {!loading && teams.length >= 3 && (
          <div className="fade-up d1 grid grid-cols-3 gap-3 mb-6">
            {[teams[1], teams[0], teams[2]].map((t, i) => {
              const rank = [2, 1, 3][i];
              const rs = RANK_STYLE[rank];
              const height = rank === 1 ? "h-28" : "h-20";
              return (
                <div
                  key={t.TeamID}
                  className={`rounded-2xl flex flex-col items-center justify-end pb-5 pt-4 px-3 ${height} relative overflow-hidden`}
                  style={{
                    background: "rgba(13,17,30,.9)",
                    border: `1px solid ${rs.border}`,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${rs.color}, transparent 70%)`,
                    }}
                  />
                  <div className="text-lg mb-1">
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div
                    className="font-black text-white text-center text-sm leading-tight"
                    style={{ fontFamily: "'Orbitron',monospace" }}
                  >
                    {t.ShortName}
                  </div>
                  <div
                    className="text-xs mt-1 font-bold"
                    style={{ color: rs.color }}
                  >
                    {t.Wins}W — {t.Losses}L
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div
          className="fade-up d2 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(167,139,250,.1)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(167,139,250,.08)",
                    background: "rgba(0,0,0,.3)",
                  }}
                >
                  {[
                    "Hạng",
                    "Đội Tuyển",
                    "Thắng",
                    "Thua",
                    "Điểm",
                    "Win Rate",
                    "Goal Diff",
                    "Trận",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-left whitespace-nowrap text-xs font-bold uppercase tracking-widest"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div
                        className="flex items-center justify-center gap-3"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        <span className="spinner" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && teams.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      {seasonId
                        ? "Chưa có dữ liệu cho mùa giải này."
                        : "Chọn mùa giải để xem bảng xếp hạng."}
                    </td>
                  </tr>
                )}
                {!loading &&
                  teams.map((t) => {
                    const rs = RANK_STYLE[t.Standing_Rank];
                    const winPct =
                      maxWins > 0 ? ((t.Wins / maxWins) * 100).toFixed(0) : 0;
                    return (
                      <tr
                        key={t.TeamID}
                        style={{
                          borderBottom: "1px solid rgba(167,139,250,.04)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td className="px-5 py-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                            style={
                              rs
                                ? {
                                    background: rs.bg,
                                    color: rs.color,
                                    border: `1px solid ${rs.border}`,
                                  }
                                : {
                                    background: "rgba(148,163,184,.08)",
                                    color: "rgba(148,163,184,.5)",
                                    border: "1px solid rgba(148,163,184,.15)",
                                    fontFamily: "'Orbitron',monospace",
                                    fontSize: "0.7rem",
                                  }
                            }
                          >
                            {rs
                              ? ["🥇", "🥈", "🥉"][t.Standing_Rank - 1]
                              : t.Standing_Rank}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className="font-black text-white"
                            style={{
                              fontFamily: "'Orbitron',monospace",
                              fontSize: "0.85rem",
                            }}
                          >
                            {t.ShortName}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "rgba(148,163,184,.5)" }}
                          >
                            {t.TeamName}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-black text-lg"
                              style={{ color: "#34d399" }}
                            >
                              {t.Wins}
                            </span>
                            <div
                              className="hidden sm:block w-16 h-1.5 rounded-full"
                              style={{ background: "rgba(52,211,153,.15)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${winPct}%`,
                                  background: "#34d399",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-5 py-4 font-black text-lg"
                          style={{ color: "#f87171" }}
                        >
                          {t.Losses}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="font-black text-sm px-2.5 py-1 rounded-lg"
                            style={{
                              color: "#fbbf24",
                              background: "rgba(251,191,36,.12)",
                              fontFamily: "'Orbitron',monospace",
                            }}
                          >
                            {t.Points}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
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
                          </span>
                        </td>
                        <td
                          className="px-5 py-4 font-bold text-sm"
                          style={{
                            color: t.GoalDiff >= 0 ? "#34d399" : "#f87171",
                          }}
                        >
                          {t.GoalDiff >= 0 ? `+${t.GoalDiff}` : t.GoalDiff}
                        </td>
                        <td
                          className="px-5 py-4 font-semibold"
                          style={{ color: "rgba(148,163,184,.7)" }}
                        >
                          {t.TotalMatches}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <p
          className="text-xs mt-4 text-center"
          style={{ color: "rgba(148,163,184,.3)" }}
        >
          Dữ liệu từ SQL Server · View: vw_TeamStandings · DENSE_RANK theo Wins
          DESC
        </p>
      </div>
    </div>
  );
};

export default TeamStandings;
