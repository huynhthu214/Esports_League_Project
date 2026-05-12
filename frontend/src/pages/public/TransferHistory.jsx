import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { ArrowLeftRight } from "lucide-react";

const STYLE = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.1s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(52,211,153,.2); border-top-color:#34d399; width:16px; height:16px; display:inline-block; }
`;

const fmtDate = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
const fmtFee = (f) =>
  !f || f === 0 ? "Free" : `${Number(f).toLocaleString("vi-VN")} ₫`;

const POSITION_COLOR = {
  Top: "#fb923c",
  Jungle: "#34d399",
  Mid: "#a78bfa",
  ADC: "#f87171",
  Support: "#38bdf8",
};

const TransferHistory = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTransfers = (sid) => {
    setLoading(true);
    setError("");
    axiosClient
      .get("/admin/transfers", { params: { seasonId: sid } })
      .then((r) => setTransfers(r.data?.data || []))
      .catch(() => setError("Không tải được lịch sử chuyển nhượng."))
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
          fetchTransfers(active.SeasonID);
        } else setLoading(false);
      })
      .catch(() => {
        setError("Không tải được mùa giải.");
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeasonChange = (e) => {
    setSeasonId(e.target.value);
    fetchTransfers(e.target.value);
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] w-full relative overflow-x-hidden text-slate-200 font-sans"
      style={{ background: "#080c16" }}
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
              "radial-gradient(ellipse,rgba(52,211,153,.08) 0%,transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(52,211,153,.7)" }}
            >
              Chuyển Nhượng
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase mb-1">
            Lịch Sử Chuyển Nhượng
          </h1>
        </div>

        {/* Season selector */}
        <div className="fade-up d1 flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={seasonId}
            onChange={handleSeasonChange}
            className="text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(13,17,30,.9)",
              border: "1px solid rgba(52,211,153,.25)",
              color: "#34d399",
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

        {/* Stats summary */}
        {transfers.length > 0 && (
          <div className="fade-up d1 grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Tổng giao dịch",
                value: transfers.length,
                color: "#34d399",
              },
              {
                label: "Tổng phí",
                value: fmtFee(
                  transfers.reduce((s, t) => s + (t.TransferFee || 0), 0),
                ),
                color: "#fbbf24",
              },
              {
                label: "Tuyển thủ",
                value: new Set(transfers.map((t) => t.PlayerNickname)).size,
                color: "#a78bfa",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3 text-center"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: `1px solid ${s.color}22`,
                }}
              >
                <div className="text-xl font-black text-white">{s.value}</div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(148,163,184,.5)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && transfers.length === 0 && !error && (
          <div
            className="fade-up text-center py-20"
            style={{ color: "rgba(148,163,184,.4)" }}
          >
            <ArrowLeftRight size={36} className="mb-3 mx-auto text-slate-600" />
            <div className="text-sm">
              Chưa có giao dịch chuyển nhượng nào trong mùa này.
            </div>
          </div>
        )}

        {/* Transfer cards */}
        <div className="flex flex-col gap-3">
          {transfers.map((t, i) => {
            const pc = POSITION_COLOR[t.Position] || "#94a3b8";
            return (
              <div
                key={t.TransferID || i}
                className="fade-up rounded-2xl px-5 py-4 relative overflow-hidden"
                style={{
                  background: "rgba(13,17,30,.9)",
                  border: "1px solid rgba(52,211,153,.1)",
                  animationDelay: `${i * 0.03 + 0.1}s`,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{
                    background:
                      "radial-gradient(circle at 0% 50%, #34d399, transparent 60%)",
                  }}
                />

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Player */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                      style={{
                        background: `${pc}18`,
                        color: pc,
                        border: `1px solid ${pc}30`,
                      }}
                    >
                      {(t.PlayerNickname || "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-white text-sm">
                        {t.PlayerNickname}
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${pc}18`, color: pc }}
                      >
                        {t.Position}
                      </span>
                    </div>
                  </div>

                  {/* Transfer arrow */}
                  <div className="flex items-center gap-2 flex-1 justify-center min-w-[160px]">
                    <span
                      className="font-black text-sm px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(248,113,113,.12)",
                        color: "#f87171",
                        border: "1px solid rgba(248,113,113,.2)",
                      }}
                    >
                      {t.FromShort}
                    </span>
                    <span className="text-lg">→</span>
                    <span
                      className="font-black text-sm px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(52,211,153,.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,.2)",
                      }}
                    >
                      {t.ToShort}
                    </span>
                  </div>

                  {/* Fee + Date */}
                  <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                    <div className="text-right">
                      <div
                        className="text-xs font-semibold"
                        style={{ color: "#fbbf24" }}
                      >
                        {fmtFee(t.TransferFee)}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "rgba(148,163,184,.4)" }}
                      >
                        {fmtDate(t.TransferDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {t.Reason && (
                  <div
                    className="mt-3 text-xs px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(148,163,184,.05)",
                      color: "rgba(148,163,184,.6)",
                      borderLeft: "2px solid rgba(148,163,184,.2)",
                    }}
                  >
                    {t.Reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransferHistory;
