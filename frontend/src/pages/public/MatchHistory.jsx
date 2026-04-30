import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(167,139,250,.2); border-top-color:#a78bfa; width:16px; height:16px; display:inline-block; }
`;

const fmtDate = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

const MatchHistory = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMatches = (sid) => {
    setLoading(true);
    setError("");
    axiosClient
      .get("/admin/matches/history", { params: { seasonId: sid } })
      .then((r) => setMatches(r.data?.data || []))
      .catch(() => setError("Không tải được lịch sử trận đấu."))
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
          fetchMatches(active.SeasonID);
        } else setLoading(false);
      })
      .catch(() => {
        setError("Không tải được mùa giải.");
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeasonChange = (e) => {
    setSeasonId(e.target.value);
    fetchMatches(e.target.value);
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
          className="absolute top-0 right-0 w-[400px] h-80 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse,rgba(167,139,250,.1) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(167,139,250,.7)" }}
            >
              Lịch Sử
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{
              fontFamily: "'Orbitron',monospace",
              textShadow: "0 0 30px rgba(167,139,250,.3)",
            }}
          >
            ⚔️ Lịch Sử Trận Đấu
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.6)" }}>
            Kết quả các trận đấu đã hoàn thành.
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
              border: "1px solid rgba(167,139,250,.25)",
              color: "#a78bfa",
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

        {!loading && matches.length === 0 && !error && (
          <div
            className="fade-up text-center py-20"
            style={{ color: "rgba(148,163,184,.4)" }}
          >
            <div className="text-4xl mb-3">🏟️</div>
            <div className="text-sm">
              Chưa có trận đấu nào hoàn thành trong mùa này.
            </div>
          </div>
        )}

        {/* Table */}
        {matches.length > 0 && (
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
                      "Ngày",
                      "Đội 1",
                      "Tỉ số",
                      "Đội 2",
                      "Thắng",
                      "MVP",
                      "Format",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => (
                    <tr
                      key={m.MatchID || i}
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
                      {/* Ngày */}
                      <td
                        className="px-4 py-4 text-xs whitespace-nowrap"
                        style={{ color: "rgba(148,163,184,.6)" }}
                      >
                        {fmtDate(m.MatchDate)}
                      </td>

                      {/* Team 1 */}
                      <td className="px-4 py-4">
                        <div
                          className="font-black text-sm"
                          style={{
                            color:
                              m.WinnerShort === m.Team1Short
                                ? "#34d399"
                                : "#94a3b8",
                            fontFamily: "'Orbitron',monospace",
                          }}
                        >
                          {m.Team1Short}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.4)" }}
                        >
                          {m.Team1Name}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4">
                        <span
                          className="font-black px-3 py-1.5 rounded-lg text-sm"
                          style={{
                            background: "rgba(167,139,250,.1)",
                            color: "#a78bfa",
                            border: "1px solid rgba(167,139,250,.2)",
                            fontFamily: "'Orbitron',monospace",
                          }}
                        >
                          {m.Team1Score ?? "—"}:{m.Team2Score ?? "—"}
                        </span>
                      </td>

                      {/* Team 2 */}
                      <td className="px-4 py-4">
                        <div
                          className="font-black text-sm"
                          style={{
                            color:
                              m.WinnerShort === m.Team2Short
                                ? "#34d399"
                                : "#94a3b8",
                            fontFamily: "'Orbitron',monospace",
                          }}
                        >
                          {m.Team2Short}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(148,163,184,.4)" }}
                        >
                          {m.Team2Name}
                        </div>
                      </td>

                      {/* Winner */}
                      <td className="px-4 py-4">
                        <span
                          className="text-xs font-black px-2.5 py-1 rounded-lg"
                          style={{
                            background: "rgba(52,211,153,.12)",
                            color: "#34d399",
                            border: "1px solid rgba(52,211,153,.25)",
                            fontFamily: "'Orbitron',monospace",
                          }}
                        >
                          🏆 {m.WinnerShort || "—"}
                        </span>
                      </td>

                      {/* MVP */}
                      <td
                        className="px-4 py-4 text-xs font-semibold"
                        style={{ color: "#fbbf24" }}
                      >
                        {m.MVPNickname ? `⭐ ${m.MVPNickname}` : "—"}
                      </td>

                      {/* Format */}
                      <td className="px-4 py-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(148,163,184,.08)",
                            color: "rgba(148,163,184,.6)",
                          }}
                        >
                          {m.Format || "BO3"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
