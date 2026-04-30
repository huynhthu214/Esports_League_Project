import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s} .d3{animation-delay:.15s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(56,189,248,.2); border-top-color:#38bdf8; width:16px; height:16px; display:inline-block; }
`;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};
const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MatchSchedule = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSchedule = (sid) => {
    setLoading(true);
    setError("");
    axiosClient
      .get("/admin/matches/schedule", { params: { seasonId: sid } })
      .then((r) => setMatches(r.data?.data || []))
      .catch(() => setError("Không tải được lịch thi đấu."))
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
          fetchSchedule(active.SeasonID);
        } else setLoading(false);
      })
      .catch(() => {
        setError("Không tải được mùa giải.");
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeasonChange = (e) => {
    setSeasonId(e.target.value);
    fetchSchedule(e.target.value);
  };

  // Group theo ngày
  const grouped = matches.reduce((acc, m) => {
    const key = fmtDate(m.MatchDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

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
              "radial-gradient(ellipse,rgba(56,189,248,.1) 0%,transparent 70%)",
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
              Public
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{
              fontFamily: "'Orbitron',monospace",
              textShadow: "0 0 30px rgba(56,189,248,.3)",
            }}
          >
            📅 Lịch Thi Đấu
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Các trận đấu sắp diễn ra trong mùa giải.
          </p>
        </div>

        {/* Season selector */}
        <div className="fade-up d1 flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={seasonId}
            onChange={handleSeasonChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(56,189,248,.25)",
              color: "#38bdf8",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.75rem",
            }}
          >
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

        {/* Matches grouped by date */}
        {!loading && matches.length === 0 && !error && (
          <div
            className="fade-up text-center py-20"
            style={{ color: "rgba(148,163,184,.4)" }}
          >
            <div className="text-4xl mb-3">📭</div>
            <div className="text-sm">
              Không có trận đấu nào sắp diễn ra trong mùa này.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, dayMatches], gi) => (
            <div
              key={date}
              className={`fade-up`}
              style={{ animationDelay: `${gi * 0.05 + 0.1}s` }}
            >
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest"
                  style={{
                    background: "rgba(56,189,248,.12)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56,189,248,.25)",
                    fontFamily: "'Orbitron',monospace",
                  }}
                >
                  {date}
                </div>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(56,189,248,.1)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "rgba(148,163,184,.4)" }}
                >
                  {dayMatches.length} trận
                </span>
              </div>

              {/* Match cards */}
              <div className="flex flex-col gap-3">
                {dayMatches.map((m) => (
                  <div
                    key={m.MatchID}
                    className="rounded-2xl px-6 py-5 flex items-center gap-4 relative overflow-hidden"
                    style={{
                      background: "rgba(13,17,30,.9)",
                      border: "1px solid rgba(56,189,248,.1)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none opacity-5"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 0%, #38bdf8, transparent 60%)",
                      }}
                    />

                    {/* Team 1 */}
                    <div className="flex-1 text-right">
                      <div
                        className="font-black text-white text-lg"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team1Short}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        {m.Team1Name}
                      </div>
                    </div>

                    {/* VS center */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className="text-xs font-black px-3 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(56,189,248,.1)",
                          color: "#38bdf8",
                          border: "1px solid rgba(56,189,248,.2)",
                          fontFamily: "'Orbitron',monospace",
                        }}
                      >
                        {fmtTime(m.MatchDate) || "VS"}
                      </div>
                      <div className="flex gap-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(167,139,250,.12)",
                            color: "#a78bfa",
                          }}
                        >
                          {m.Format || "BO3"}
                        </span>
                        {m.Stage && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(148,163,184,.08)",
                              color: "rgba(148,163,184,.6)",
                            }}
                          >
                            {m.Stage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1">
                      <div
                        className="font-black text-white text-lg"
                        style={{ fontFamily: "'Orbitron',monospace" }}
                      >
                        {m.Team2Short}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        {m.Team2Name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchSchedule;
