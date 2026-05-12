import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

/* eslint-disable react-hooks/set-state-in-effect */

const POSITIONS = ["", "Top", "Jungle", "Mid", "ADC", "Support"];

const POSITION_COLOR = {
  Top: {
    bg: "rgba(251,146,60,.15)",
    text: "#fb923c",
    border: "rgba(251,146,60,.3)",
  },
  Jungle: {
    bg: "rgba(52,211,153,.15)",
    text: "#34d399",
    border: "rgba(52,211,153,.3)",
  },
  Mid: {
    bg: "rgba(167,139,250,.15)",
    text: "#a78bfa",
    border: "rgba(167,139,250,.3)",
  },
  ADC: {
    bg: "rgba(248,113,113,.15)",
    text: "#f87171",
    border: "rgba(248,113,113,.3)",
  },
  Support: {
    bg: "rgba(56,189,248,.15)",
    text: "#38bdf8",
    border: "rgba(56,189,248,.3)",
  },
};

const kdaColor = (v) => {
  if (v >= 8) return "#a78bfa";
  if (v >= 5) return "#34d399";
  if (v >= 3) return "#38bdf8";
  return "#94a3b8";
};

const STYLE = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(56,189,248,.2); border-top-color:#38bdf8; width:18px; height:18px; display:inline-block; }
  tr { transition: background .15s; }
`;

const MEDAL = { 1: "#1", 2: "#2", 3: "#3" };

const PlayerLeaderboard = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [position, setPosition] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeason, setLoadingSeason] = useState(true);
  const [error, setError] = useState("");

  // ── BƯỚC 1: Load danh sách mùa giải khi mount ──────────────────
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

  // ── BƯỚC 2: Fetch leaderboard mỗi khi seasonId hoặc position thay đổi ──
  const fetchLeaderboard = useCallback(() => {
    if (!seasonId) return;

    setLoading(true);
    setError("");
    setData([]);

    const params = { seasonId };
    if (position) params.position = position;

    axiosClient
      .get("/admin/leaderboards/players", { params })
      .then((r) => setData(r.data?.data || []))
      .catch(() => setError("Không tải được dữ liệu leaderboard."))
      .finally(() => setLoading(false));
  }, [seasonId, position]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div
      className="min-h-[calc(100vh-80px)] w-full relative overflow-x-hidden text-slate-200 font-sans"
      style={{ background: "#080c16" }}
    >
      <style>{STYLE}</style>

      {/* Background */}
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
          className="absolute -top-40 right-0 w-[500px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(167,139,250,.12) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(56,189,248,.7)" }}
            >
              Bảng Xếp Hạng
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-1">
            KDA Leaderboard
          </h1>
        </div>

        {/* Filters */}
        <div className="fade-up flex flex-wrap gap-3 mb-6">
          {/* Dropdown mùa giải */}
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            disabled={loadingSeason}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(56,189,248,.25)",
              color: "#38bdf8",
            }}
          >
            {loadingSeason ? (
              <option>Đang tải...</option>
            ) : seasons.length === 0 ? (
              <option value="">Chưa có mùa giải</option>
            ) : (
              seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName}
                </option>
              ))
            )}
          </select>

          {/* Dropdown vị trí */}
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(167,139,250,.25)",
              color: "#a78bfa",
            }}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p || "Tất cả vị trí"}
              </option>
            ))}
          </select>

          {/* Spinner */}
          {loading && (
            <div className="flex items-center gap-2 px-3">
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

        {/* Table */}
        <div
          className="fade-up rounded-2xl overflow-hidden"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(56,189,248,.1)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(56,189,248,.08)",
                    background: "rgba(0,0,0,.3)",
                  }}
                >
                  {[
                    "Hạng",
                    "Tuyển thủ",
                    "Vị trí",
                    "Đội",
                    "Trận",
                    "K",
                    "D",
                    "A",
                    "KDA TB",
                    "GPM TB",
                    "Win%",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left whitespace-nowrap text-xs font-bold uppercase tracking-widest"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading skeleton */}
                {loading && (
                  <tr>
                    <td colSpan={11} className="px-5 py-16 text-center">
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

                {/* Empty state */}
                {!loading && data.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-5 py-16 text-center"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      {seasonId
                        ? "Chưa có dữ liệu cho mùa giải này."
                        : "Chọn mùa giải để xem bảng xếp hạng."}
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading &&
                  data.map((row, i) => {
                    const pc = POSITION_COLOR[row.Position] || {
                      bg: "rgba(100,116,139,.15)",
                      text: "#94a3b8",
                      border: "rgba(100,116,139,.3)",
                    };
                    return (
                      <tr
                        key={row.PlayerID || i}
                        className="group"
                        style={{
                          borderBottom: "1px solid rgba(56,189,248,.04)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Hạng */}
                        <td className="px-4 py-4 text-center">
                          {MEDAL[row.KDA_Rank] ? (
                            <span className="text-lg">
                              {MEDAL[row.KDA_Rank]}
                            </span>
                          ) : (
                            <span
                              className="text-sm font-black"
                              style={{
                                color: "rgba(148,163,184,.5)",
                              }}
                            >
                              #{row.KDA_Rank}
                            </span>
                          )}
                        </td>

                        {/* Nickname */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{
                                background: pc.bg,
                                color: pc.text,
                                border: `1px solid ${pc.border}`,
                              }}
                            >
                              {(row.Nickname || "??").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {row.Nickname}
                            </span>
                          </div>
                        </td>

                        {/* Vị trí */}
                        <td className="px-4 py-4">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{
                              background: pc.bg,
                              color: pc.text,
                              border: `1px solid ${pc.border}`,
                            }}
                          >
                            {row.Position}
                          </span>
                        </td>

                        {/* Đội */}
                        <td
                          className="px-4 py-4 font-bold"
                          style={{ color: "rgba(148,163,184,.7)" }}
                        >
                          {row.TeamShort}
                        </td>

                        {/* Stats */}
                        <td className="px-4 py-4 font-semibold text-white">
                          {row.TotalMatches}
                        </td>
                        <td
                          className="px-4 py-4 font-bold"
                          style={{ color: "#34d399" }}
                        >
                          {row.TotalKills}
                        </td>
                        <td
                          className="px-4 py-4 font-bold"
                          style={{ color: "#f87171" }}
                        >
                          {row.TotalDeaths}
                        </td>
                        <td
                          className="px-4 py-4 font-bold"
                          style={{ color: "#38bdf8" }}
                        >
                          {row.TotalAssists}
                        </td>

                        {/* KDA */}
                        <td className="px-4 py-4">
                          <span
                            className="text-sm font-black px-2.5 py-1 rounded-lg"
                            style={{
                              color: kdaColor(row.AvgKDA),
                              background: `${kdaColor(row.AvgKDA)}18`,
                            }}
                          >
                            {Number(row.AvgKDA).toFixed(2)}
                          </span>
                        </td>

                        {/* GPM */}
                        <td
                          className="px-4 py-4 font-semibold"
                          style={{ color: "#fbbf24" }}
                        >
                          {Number(row.AvgGPM).toLocaleString()}
                        </td>

                        {/* WinRate */}
                        <td className="px-4 py-4">
                          <span
                            className="font-bold"
                            style={{
                              color:
                                row.WinRate >= 60
                                  ? "#34d399"
                                  : row.WinRate >= 40
                                    ? "#94a3b8"
                                    : "#f87171",
                            }}
                          >
                            {Number(row.WinRate).toFixed(1)}%
                          </span>
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
          Xếp hạng theo AvgKDA
        </p>
      </div>
    </div>
  );
};

export default PlayerLeaderboard;
