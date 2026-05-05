import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes barIn { from{width:0} to{width:var(--w)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(52,211,153,.2); border-top-color:#34d399; width:18px; height:18px; display:inline-block; }
`;

const TIER_COLOR = (i) =>
  i === 0
    ? "#fbbf24"
    : i === 1
      ? "#94a3b8"
      : i === 2
        ? "#cd7c3b"
        : i < 5
          ? "#34d399"
          : "#38bdf8";
const TIER_LABEL = (i) =>
  i === 0 ? "S" : i === 1 ? "A+" : i === 2 ? "A" : i < 5 ? "B" : "C";

const MetaTrends = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [heroes, setHeroes] = useState([]);
  const [totalPicks, setTotalPicks] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("pick_count");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHeroes = (sid, next = {}) => {
    setLoading(true);
    setError("");
    axiosClient
      .get("/analytics/meta-heroes", {
        params: {
          ...(sid ? { seasonId: sid } : {}),
          limit: next.limit ?? limit,
          sortBy: next.sortBy ?? sortBy,
        },
      })
      .then((r) => {
        const d = r.data;
        const list = d?.heroes || [];
        setTotalPicks(d?.total_picks || 0);
        if (!list?.length) setError("Chưa có dữ liệu tướng trong MongoDB.");
        else setHeroes(list);
      })
      .catch(() => setError("Không tải được dữ liệu Meta."))
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
          fetchHeroes(active.SeasonID);
        } else fetchHeroes("");
      })
      .catch(() => fetchHeroes(""));
  }, []); // eslint-disable-line

  const handleSeasonChange = (e) => {
    setSeasonId(e.target.value);
    fetchHeroes(e.target.value);
  };
  const maxPick = heroes[0]?.pick_count || 1;
  const handleLimitChange = (e) => {
    const n = parseInt(e.target.value, 10) || 10;
    setLimit(n);
    fetchHeroes(seasonId, { limit: n });
  };
  const handleSortChange = (e) => {
    const s = e.target.value;
    setSortBy(s);
    fetchHeroes(seasonId, { sortBy: s });
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
              "linear-gradient(rgba(52,211,153,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 left-0 w-[400px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(52,211,153,.1) 0%,transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(52,211,153,.7)" }}
            >
              MongoDB Aggregation
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            🧠 Meta Tướng
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Top 10 tướng được pick nhiều nhất và win rate tương ứng.
          </p>
        </div>
        <div className="fade-up flex gap-3 mb-6 flex-wrap">
          <select
            value={seasonId}
            onChange={handleSeasonChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(52,211,153,.25)",
              color: "#34d399",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.72rem",
            }}
          >
            <option value="">-- Tất cả mùa --</option>
            {seasons.map((s) => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.SeasonName}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={handleLimitChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(52,211,153,.15)",
              color: "rgba(226,232,240,.9)",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.72rem",
            }}
          >
            {[10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(52,211,153,.15)",
              color: "rgba(226,232,240,.9)",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.72rem",
            }}
          >
            <option value="pick_count">Sort: Pick nhiều</option>
            <option value="win_rate">Sort: Win rate</option>
            <option value="avg_kda">Sort: KDA TB</option>
            <option value="avg_gpm">Sort: GPM TB</option>
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
        {!loading && heroes.length === 0 && !error && (
          <div
            className="text-center py-20"
            style={{ color: "rgba(148,163,184,.4)" }}
          >
            <div className="text-4xl mb-3">🧠</div>
            <div className="text-sm">
              Chưa có dữ liệu tướng. Nhập kết quả trận đấu vào MongoDB trước.
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {heroes.map((h, i) => {
            const color = TIER_COLOR(i);
            const barW = `${(h.pick_count / maxPick) * 100}%`;
            const wrColor =
              h.win_rate >= 60
                ? "#34d399"
                : h.win_rate >= 45
                  ? "#fbbf24"
                  : "#f87171";
            return (
              <div
                key={h._id || i}
                className="fade-up rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: `1px solid ${color}20`,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}30`,
                      fontFamily: "'Orbitron',monospace",
                    }}
                  >
                    {TIER_LABEL(i)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-black text-white text-sm truncate"
                      style={{ fontFamily: "'Orbitron',monospace" }}
                    >
                      {h._id || "Unknown"}
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-0.5 flex-wrap">
                      <span style={{ color: "rgba(148,163,184,.6)" }}>
                        {h.pick_count} lần pick
                      </span>
                      <span style={{ color: "rgba(148,163,184,.6)" }}>
                        PR {h.pick_rate}%
                        {totalPicks ? (
                          <span style={{ color: "rgba(148,163,184,.35)" }}>
                            {" "}
                            (/{totalPicks})
                          </span>
                        ) : null}
                      </span>
                      <span className="font-bold" style={{ color: wrColor }}>
                        WR {h.win_rate}%
                      </span>
                      {h.avg_kda != null && (
                        <span style={{ color: "rgba(56,189,248,.85)" }}>
                          KDA {h.avg_kda}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: "rgba(148,163,184,.45)" }}
                    >
                      {h.avg_kills != null ? `${h.avg_kills}` : "-"} /
                      {h.avg_deaths != null ? ` ${h.avg_deaths}` : " -"} /
                      {h.avg_assists != null ? ` ${h.avg_assists}` : " -"}{" "}
                      <span style={{ color: "rgba(148,163,184,.3)" }}>·</span>{" "}
                      GPM {h.avg_gpm != null ? h.avg_gpm : "-"}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "rgba(148,163,184,.4)" }}
                    >
                      Share
                    </div>
                    <div
                      className="font-black text-sm"
                      style={{ color, fontFamily: "'Orbitron',monospace" }}
                    >
                      {h.pick_rate != null ? `${h.pick_rate}%` : "-"}
                    </div>
                  </div>
                </div>
                <div
                  className="h-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,.05)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: barW,
                      background: `linear-gradient(90deg,${color},${color}88)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default MetaTrends;
