import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

const STYLE = `
  @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  .dot-blink { animation: dot-blink 1.8s ease infinite; }
`;

const POSITIONS = ["Top", "Jungle", "Mid", "ADC", "Support"];
const POS_COLOR = {
  Top: "border-red-500/40 text-red-400",
  Jungle: "border-green-500/40 text-green-400",
  Mid: "border-blue-500/40 text-blue-400",
  ADC: "border-orange-500/40 text-orange-400",
  Support: "border-purple-500/40 text-purple-400",
};

const sel = "ui-select";

const RosterForm = () => {
  // ── Dữ liệu dropdown ────────────────────────────────────────────
  const [seasons, setSeasons] = useState([]);
  const [seasonTeams, setSeasonTeams] = useState([]); // đội thuộc mùa đã chọn
  const [seasonPlayers, setSeasonPlayers] = useState([]); // player chưa có roster trong đội+mùa

  // ── Form state ───────────────────────────────────────────────────
  const [seasonId, setSeasonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerIds, setPlayerIds] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Loading indicators cho từng tầng
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // ── BƯỚC 1: Load mùa giải, auto-select ACTIVE ───────────────────
  const fetchSeasons = useCallback(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        // Smart default: chọn mùa ACTIVE, fallback mùa đầu tiên
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSeasonId(active.SeasonID);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // ── BƯỚC 2: Khi seasonId thay đổi → load đội thuộc mùa đó ──────
  const fetchSeasonTeams = useCallback(() => {
    if (!seasonId) {
      setSeasonTeams([]);
      setTeamId("");
      return;
    }
    setLoadingTeams(true);
    setTeamId("");
    setPlayerIds([]);
    setSeasonPlayers([]);
    axiosClient
      .get("/admin/season-teams", { params: { seasonId } })
      .then((r) => setSeasonTeams(r.data?.data || []))
      .catch(() => setSeasonTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [seasonId]);
  useEffect(() => {
    fetchSeasonTeams();
  }, [fetchSeasonTeams]);

  // ── BƯỚC 3: Khi teamId thay đổi → load player chưa có roster ───
  const fetchAvailablePlayers = useCallback(() => {
    if (!seasonId || !teamId) {
      setSeasonPlayers([]);
      setPlayerIds([]);
      return;
    }
    setLoadingPlayers(true);
    setPlayerIds([]);
    // Lấy tất cả player IsActive=1, sau đó lọc trừ người đã có roster trong đội+mùa này
    // Thay Promise.all cũ bằng:
    axiosClient
      .get("/admin/players/available", {
        params: { seasonId, teamId },
      })
      .then((r) => setSeasonPlayers(r.data?.data || []))
      .catch(() => setSeasonPlayers([]))
      .finally(() => setLoadingPlayers(false));
  }, [seasonId, teamId]);
  useEffect(() => {
    fetchAvailablePlayers();
  }, [fetchAvailablePlayers]);

  const togglePlayer = (pid) =>
    setPlayerIds((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid],
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await axiosClient.post("/admin/rosters", {
        teamId,
        seasonId,
        playerIds,
      });
      setStatus({
        type: "success",
        message: res.data.message || "Đăng ký Roster thành công!",
      });
      setPlayerIds([]);
      fetchAvailablePlayers(); // refresh danh sách
    } catch (err) {
      const data = err.response?.data;
      setStatus({
        type: data?.type === "TRIGGER_VIOLATION" ? "trigger" : "error",
        message: data?.message || "Lỗi server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const byPos = (pos) => seasonPlayers.filter((p) => p.Position === pos);
  const selectedSeason = seasons.find((s) => s.SeasonID === seasonId);
  const selectedTeam = seasonTeams.find((t) => t.TeamID === teamId);

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <style>{STYLE}</style>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 uppercase mb-1">
          Đăng ký Roster
        </h1>

        {status && (
          <div
            className={`mb-6 p-4 border rounded-xl text-sm font-medium ${
              status.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : status.type === "trigger"
                  ? "bg-amber-900/20 border-amber-500/30 text-amber-400"
                  : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {status.type === "trigger" && <strong></strong>}
            {status.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-6"
        >
          {/* ── Tầng 1: Mùa giải ── */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bước 1 — Chọn mùa giải
            </label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              required
              className={sel}
            >
              <option value="">-- Chọn mùa giải --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} [{s.Status}]
                </option>
              ))}
            </select>
          </div>

          {/* ── Tầng 2: Đội (chỉ đội thuộc mùa đã chọn) ── */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bước 2 — Chọn đội tuyển
              {seasonId && (
                <span className="ml-2 text-blue-400 normal-case font-normal">
                  ({seasonTeams.length} đội trong {selectedSeason?.SeasonName})
                </span>
              )}
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              disabled={!seasonId || loadingTeams}
              className={sel}
            >
              <option value="">
                {loadingTeams
                  ? "Đang tải đội..."
                  : seasonId
                    ? "-- Chọn đội --"
                    : "← Chọn mùa trước"}
              </option>
              {seasonTeams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName} ({t.ShortName})
                </option>
              ))}
            </select>
          </div>

          {/* ── Tầng 3: Player (chỉ player chưa có roster trong đội+mùa) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Bước 3 — Chọn tuyển thủ
                {teamId && !loadingPlayers && (
                  <span className="ml-2 text-blue-400 normal-case font-normal">
                    ({seasonPlayers.length} khả dụng trong{" "}
                    {selectedTeam?.TeamName})
                  </span>
                )}
              </label>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                  playerIds.length >= 5
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-slate-800 border-slate-700 text-slate-500"
                }`}
              >
                {playerIds.length} / 10 đã chọn
              </span>
            </div>

            {!teamId ? (
              <div className="border border-slate-800 rounded-xl p-6 text-center text-slate-600 text-sm">
                ← Chọn đội tuyển trước để xem danh sách tuyển thủ khả dụng
              </div>
            ) : loadingPlayers ? (
              <div className="border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
                Đang tải danh sách tuyển thủ...
              </div>
            ) : seasonPlayers.length === 0 ? (
              <div className="border border-amber-800/30 bg-amber-900/10 rounded-xl p-6 text-center text-amber-400 text-sm">
                ⚠️ Tất cả tuyển thủ đã có trong roster của đội này. Không còn ai
                để thêm.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/50">
                {POSITIONS.map((pos) => {
                  const posPlayers = byPos(pos);
                  if (posPlayers.length === 0) return null;
                  return (
                    <div key={pos} className="p-4">
                      <p
                        className={`text-xs font-bold uppercase tracking-wide mb-3 border-l-2 pl-2 ${POS_COLOR[pos]}`}
                      >
                        {pos}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {posPlayers.map((p) => {
                          const checked = playerIds.includes(p.PlayerID);
                          return (
                            <label
                              key={p.PlayerID}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all duration-150 ${
                                checked
                                  ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400"
                                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={checked}
                                onChange={() => togglePlayer(p.PlayerID)}
                              />
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${checked ? "bg-cyan-400" : "bg-slate-600"}`}
                              />
                              {p.Nickname}
                              <span className="text-xs opacity-40">
                                ({p.PlayerID})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hint */}
          {playerIds.length > 0 && playerIds.length < 5 && (
            <p className="text-xs text-amber-400 text-center">
              Cần chọn thêm {5 - playerIds.length} tuyển thủ nữa (tối thiểu 5)
            </p>
          )}

          <button
            type="submit"
            disabled={loading || playerIds.length < 5 || !teamId || !seasonId}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg py-3 text-sm font-bold tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
          >
            {loading
              ? "Đang đăng ký..."
              : `Ghi Nhận Roster (${playerIds.length} tuyển thủ)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RosterForm;
