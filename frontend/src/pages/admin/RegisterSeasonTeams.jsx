import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Info } from "lucide-react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .4s ease both; }
  .d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}
  .spinner { animation: spin .8s linear infinite; border-radius:50%; border:2px solid rgba(52,211,153,.2); border-top-color:#34d399; width:16px; height:16px; display:inline-block; }
`;

const RegisterSeasonTeams = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [allTeams, setAllTeams] = useState([]);
  const [registered, setRegistered] = useState([]); // đã đăng ký
  const [selected, setSelected] = useState([]); // đang chọn để thêm
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", msg: "" });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  // 1. Load seasons + all teams
  useEffect(() => {
    Promise.all([
      axiosClient.get("/admin/seasons"),
      axiosClient.get("/admin/teams"),
    ])
      .then(([sr, tr]) => {
        const list = sr.data?.data || [];
        setSeasons(list);
        setAllTeams(tr.data?.data || []);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSeasonId(active.SeasonID);
      })
      .catch(() => showToast("error", "Không tải được dữ liệu."));
  }, []);

  // 2. Khi đổi mùa → load đội đã đăng ký
  const loadRegistered = (sid) => {
    if (!sid) return;
    setLoadingData(true);
    setSelected([]);
    axiosClient
      .get("/admin/season-teams", { params: { seasonId: sid } })
      .then((r) => setRegistered((r.data?.data || []).map((t) => t.TeamID)))
      .catch(() =>
        showToast("error", "Không tải được danh sách đội đã đăng ký."),
      )
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    if (seasonId) loadRegistered(seasonId);
  }, [seasonId]); // eslint-disable-line

  // Toggle chọn đội
  const toggle = (id) => {
    if (registered.includes(id)) return; // đã đăng ký rồi, không toggle
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const available = allTeams
      .filter((t) => !registered.includes(t.TeamID))
      .map((t) => t.TeamID);
    setSelected(available);
  };

  // Submit đăng ký
  const handleSubmit = async () => {
    if (!seasonId || selected.length === 0) {
      showToast("error", "Chọn ít nhất 1 đội để đăng ký.");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post("/admin/season-teams", {
        seasonId,
        teamIds: selected,
      });
      showToast("success", res.data.message || "Đăng ký thành công!");
      setSelected([]);
      loadRegistered(seasonId);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Lỗi khi đăng ký đội.");
    } finally {
      setLoading(false);
    }
  };

  const available = allTeams.filter((t) => !registered.includes(t.TeamID));
  const registeredTeams = allTeams.filter((t) => registered.includes(t.TeamID));

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-slate-200"
      style={{
        background: "#080c16",
        fontFamily: "'Rajdhani','Segoe UI',sans-serif",
      }}
    >
      <style>{STYLE}</style>

      {/* Toast */}
      <div
        className={`fixed top-6 right-6 z-50 min-w-[300px] max-w-sm rounded-xl px-5 py-4 shadow-2xl transition-all duration-300 flex items-center gap-3
        ${toast.show ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"}
        ${
          toast.type === "success"
            ? "bg-emerald-900/90 border border-emerald-500/40 text-emerald-300"
            : "bg-red-900/90 border border-red-500/40 text-red-300"
        }`}
      >
        <span className="text-xl">
          {toast.type === "success" ? "✅" : "⚠️"}
        </span>
        <span className="text-sm font-semibold flex-1">{toast.msg}</span>
        <button
          onClick={() => setToast((t) => ({ ...t, show: false }))}
          className="opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="fade-up mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(52,211,153,.7)" }}
            >
              Admin · SeasonTeams
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase text-white"
            style={{ fontFamily: "'Orbitron',monospace" }}
          >
            Đăng Ký Đội Vào Mùa
          </h1>
        </div>

        {/* Season selector */}
        <div
          className="fade-up d1 rounded-2xl p-5 mb-5"
          style={{
            background: "rgba(13,17,30,.9)",
            border: "1px solid rgba(52,211,153,.15)",
          }}
        >
          <label
            className="text-xs font-bold uppercase tracking-widest mb-2 block"
            style={{ color: "rgba(148,163,184,.5)" }}
          >
            Mùa giải
          </label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="w-full sm:w-auto text-sm font-semibold rounded-xl px-4 py-2.5 outline-none"
            style={{
              background: "rgba(0,0,0,.4)",
              border: "1px solid rgba(52,211,153,.25)",
              color: "#34d399",
              fontFamily: "'Orbitron',monospace",
              fontSize: "0.75rem",
            }}
          >
            <option value="">-- Chọn mùa --</option>
            {seasons.map((s) => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.SeasonName} [{s.Status}]
              </option>
            ))}
          </select>
        </div>

        {seasonId && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Cột trái — Đội chưa đăng ký */}
            <div
              className="fade-up d2 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,17,30,.9)",
                border: "1px solid rgba(56,189,248,.12)",
              }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(56,189,248,.08)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#38bdf8" }}
                  />
                  <span
                    className="font-bold text-sm uppercase tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron',monospace" }}
                  >
                    Chưa đăng ký ({available.length})
                  </span>
                </div>
                {available.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:scale-105"
                    style={{
                      background: "rgba(56,189,248,.12)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56,189,248,.25)",
                    }}
                  >
                    Chọn tất cả
                  </button>
                )}
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <span className="spinner" />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(148,163,184,.5)" }}
                  >
                    Đang tải...
                  </span>
                </div>
              ) : available.length === 0 ? (
                <div
                  className="text-center py-12 text-sm"
                  style={{ color: "rgba(148,163,184,.4)" }}
                >
                  Tất cả đội đã được đăng ký vào mùa này
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {available.map((t) => {
                    const isSelected = selected.includes(t.TeamID);
                    return (
                      <div
                        key={t.TeamID}
                        onClick={() => toggle(t.TeamID)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(52,211,153,.1)"
                            : "rgba(255,255,255,.02)",
                          border: `1px solid ${isSelected ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.05)"}`,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected
                              ? "#34d399"
                              : "rgba(148,163,184,.1)",
                            border: `1px solid ${isSelected ? "#34d399" : "rgba(148,163,184,.3)"}`,
                          }}
                        >
                          {isSelected && (
                            <span className="text-black text-xs font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                          style={{
                            background: "rgba(56,189,248,.1)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,.2)",
                          }}
                        >
                          {(t.ShortName || t.TeamName)
                            .slice(0, 3)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-black text-sm text-white truncate"
                            style={{
                              fontFamily: "'Orbitron',monospace",
                              fontSize: "0.78rem",
                            }}
                          >
                            {t.ShortName}
                          </div>
                          <div
                            className="text-xs truncate"
                            style={{ color: "rgba(148,163,184,.5)" }}
                          >
                            {t.TeamName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit */}
              {selected.length > 0 && (
                <div className="px-4 pb-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg,#059669,#34d399)",
                      boxShadow: "0 0 18px rgba(52,211,153,.3)",
                      fontFamily: "'Orbitron',monospace",
                      fontSize: "0.7rem",
                    }}
                  >
                    {loading ? (
                      <span className="spinner" />
                    ) : (
                      `✅ Đăng ký ${selected.length} đội`
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Cột phải — Đội đã đăng ký */}
            <div
              className="fade-up d3 rounded-2xl overflow-hidden"
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
                  Đã đăng ký ({registeredTeams.length})
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-96 overflow-y-auto">
                {registeredTeams.length === 0 && (
                  <div
                    className="text-center py-12 text-sm"
                    style={{ color: "rgba(148,163,184,.4)" }}
                  >
                    Chưa có đội nào trong mùa này
                  </div>
                )}
                {registeredTeams.map((t, i) => (
                  <div
                    key={t.TeamID}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(52,211,153,.05)",
                      border: "1px solid rgba(52,211,153,.15)",
                    }}
                  >
                    <div
                      className="w-6 text-center font-black text-xs"
                      style={{
                        color: "rgba(52,211,153,.6)",
                        fontFamily: "'Orbitron',monospace",
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{
                        background: "rgba(52,211,153,.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,.25)",
                      }}
                    >
                      {(t.ShortName || t.TeamName).slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-black text-sm text-white truncate"
                        style={{
                          fontFamily: "'Orbitron',monospace",
                          fontSize: "0.78rem",
                        }}
                      >
                        {t.ShortName}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "rgba(148,163,184,.5)" }}
                      >
                        {t.TeamName}
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(52,211,153,.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,.25)",
                      }}
                    >
                      ✓ Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hướng dẫn tiếp theo */}
        {registeredTeams.length > 0 && (
          <div
            className="fade-up mt-5 rounded-xl px-5 py-4 flex items-start gap-3"
            style={{
              background: "rgba(56,189,248,.06)",
              border: "1px solid rgba(56,189,248,.15)",
            }}
          >
            <Info size={16} className="flex-shrink-0 text-cyan-400 mt-0.5" />
            <div className="text-sm" style={{ color: "rgba(148,163,184,.8)" }}>
              Đã đăng ký{" "}
              <strong style={{ color: "#38bdf8" }}>
                {registeredTeams.length} đội
              </strong>{" "}
              vào mùa giải. Bước tiếp theo: vào{" "}
              <strong style={{ color: "#a78bfa" }}>Đăng ký Roster</strong> để
              thêm tuyển thủ cho từng đội.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterSeasonTeams;
