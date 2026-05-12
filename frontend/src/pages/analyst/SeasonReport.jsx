import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
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
      .catch(() => setError("Không tải được báo cáo."))
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
      <div className="relative z-10 max-w-5xl mx-auto p-8">
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(251,191,36,.7)" }}
            >
              Phân tích
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase mb-1">
            Báo Cáo Mùa Giải
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
                    style={{}}
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
                        }}
                      >
                        {i === 0
                          ? "#1"
                          : i === 1
                            ? "#2"
                            : i === 2
                              ? "#3"
                              : `#${t.Standing_Rank}`}
                      </div>
                      <div className="flex-1">
                        <div
                          className="font-black text-sm text-white"
                          style={{}}
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
                    style={{}}
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
                        }}
                      >
                        {`#${p.KDA_Rank}`}
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
                    style={{}}
                  >
                    Top Tướng
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
                        style={{}}
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
                      Chưa có dữ liệu tướng
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
