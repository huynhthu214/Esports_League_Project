import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

const POSITION_ORDER = ["Top", "Jungle", "Mid", "ADC", "Support"];
const POSITION_COLOR = {
  Top: "bg-red-500/20 text-red-400 border border-red-500/30",
  Jungle: "bg-green-500/20 text-green-400 border border-green-500/30",
  Mid: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  ADC: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Support: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};
const sel = "ui-select flex-1";

const RosterViewer = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonTeams, setSeasonTeams] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // ── BƯỚC 1: Mùa giải — smart default ACTIVE ─────────────────────
  const fetchSeasons = useCallback(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setSeasonId(active.SeasonID);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // ── BƯỚC 2: Đội theo mùa ────────────────────────────────────────
  const fetchSeasonTeams = useCallback(() => {
    if (!seasonId) {
      setSeasonTeams([]);
      setTeamId("");
      return;
    }
    setLoadingTeams(true);
    setTeamId("");
    setRoster([]);
    axiosClient
      .get("/admin/season-teams", { params: { seasonId } })
      .then((r) => {
        const list = r.data?.data || [];
        setSeasonTeams(list);
        // Auto-select đội đầu tiên trong mùa
        if (list.length > 0) setTeamId(list[0].TeamID);
      })
      .catch(() => setSeasonTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [seasonId]);
  useEffect(() => {
    fetchSeasonTeams();
  }, [fetchSeasonTeams]);

  // ── BƯỚC 3: Khi teamId thay đổi → tự fetch roster ───────────────
  const fetchRoster = useCallback(() => {
    if (!seasonId || !teamId) {
      setRoster([]);
      return;
    }
    setLoading(true);
    setError("");
    axiosClient
      .get(`/admin/rosters/${teamId}`, { params: { seasonId } })
      .then((r) => setRoster(r.data?.data || []))
      .catch(() => setError("Không thể tải roster. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [seasonId, teamId]);
  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const removePlayer = async (playerId) => {
    setRemoving(playerId);
    try {
      setError("");
      await axiosClient.patch("/admin/rosters/remove", {
        playerId,
        teamId,
        seasonId,
      });
      // Đồng bộ lại từ server để tránh lệch state / sp chỉ trả ACTIVE
      await fetchRoster();
      setConfirm(null);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Lỗi khi xóa thành viên. Vui lòng thử lại.";
      const dbg = err.response?.data?.debug;
      setError(dbg ? `${msg} (debug: ${JSON.stringify(dbg)})` : msg);
    } finally {
      setRemoving(null);
    }
  };

  const activeRoster = roster
    .filter((p) => p.Status === "ACTIVE")
    .sort(
      (a, b) =>
        POSITION_ORDER.indexOf(a.Position) - POSITION_ORDER.indexOf(b.Position),
    );
  const inactiveRoster = roster.filter((p) => p.Status !== "ACTIVE");
  const teamName =
    seasonTeams.find((t) => t.TeamID === teamId)?.TeamName || teamId;
  const selectedSeason = seasons.find((s) => s.SeasonID === seasonId);

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-8 font-sans relative">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-1">
          👁️ Quản lý Roster
        </h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">
          Chọn mùa → đội tự lọc theo mùa → roster tự tải · Loại bỏ chuyển trạng
          thái TRANSFERRED_OUT
        </p>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-4 mb-6 bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          {/* Mùa giải */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mùa giải
            </span>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className={sel}
            >
              <option value="">-- Chọn mùa --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} [{s.Status}]
                </option>
              ))}
            </select>
          </div>

          {/* Đội — chỉ đội thuộc mùa */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Đội tuyển
              {seasonId && !loadingTeams && (
                <span className="ml-1.5 text-cyan-400 normal-case font-normal">
                  ({seasonTeams.length} đội trong {selectedSeason?.SeasonName})
                </span>
              )}
            </span>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={!seasonId || loadingTeams}
              className={sel}
            >
              <option value="">
                {loadingTeams
                  ? "Đang tải..."
                  : seasonId
                    ? "-- Chọn đội --"
                    : "← Chọn mùa trước"}
              </option>
              {seasonTeams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest opacity-0 select-none">
              .
            </span>
            <button
              onClick={fetchRoster}
              disabled={!seasonId || !teamId || loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-5 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-40 transition-all"
            >
              {loading ? "Đang tải..." : "↺ Làm mới"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border rounded-xl text-sm font-medium bg-red-900/20 border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* ── Roster table ── */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
            Đang tải roster...
          </div>
        )}

        {!loading && teamId && roster.length === 0 && !error && (
          <div className="bg-slate-900/60 border border-amber-800/30 rounded-2xl p-12 text-center text-amber-400 text-sm">
            ⚠️ Đội này chưa có roster trong mùa giải đã chọn.
          </div>
        )}

        {!loading && activeRoster.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {teamName}
                </h2>
                <p className="text-sm text-cyan-400 mt-1">
                  {selectedSeason?.SeasonName} · {activeRoster.length} thành
                  viên ACTIVE
                </p>
              </div>
              <span
                className={`text-sm font-bold px-4 py-1.5 rounded-lg border ${
                  activeRoster.length >= 10
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {activeRoster.length}/10 Slots
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs font-bold tracking-widest">
                  <tr>
                    {[
                      "Tuyển thủ",
                      "Vị trí",
                      "KDA TB",
                      "GPM TB",
                      "Win%",
                      "Trận",
                      "",
                    ].map((h) => (
                      <th key={h} className="px-5 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
                  {activeRoster.map((p) => (
                    <tr
                      key={p.PlayerID}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-slate-200">
                        {p.Nickname}
                        <span className="block text-xs font-normal text-slate-500 mt-0.5">
                          {p.PlayerID}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-bold ${POSITION_COLOR[p.Position] || "bg-slate-700 text-slate-300"}`}
                        >
                          {p.Position}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-cyan-400 font-medium">
                        {Number(p.AvgKDA).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-amber-400 font-medium">
                        {Number(p.AvgGPM).toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {Number(p.WinRate).toFixed(1)}%
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {p.TotalMatches}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            setConfirm({
                              playerId: p.PlayerID,
                              nickname: p.Nickname,
                            })
                          }
                          className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Loại bỏ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inactive section */}
            {inactiveRoster.length > 0 && (
              <details className="mt-4">
                <summary className="text-xs text-slate-500 font-bold uppercase tracking-widest cursor-pointer hover:text-slate-400">
                  {inactiveRoster.length} thành viên đã rời đội
                </summary>
                <div className="mt-3 divide-y divide-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
                  {inactiveRoster.map((p) => (
                    <div
                      key={p.PlayerID}
                      className="flex items-center gap-4 px-5 py-3 bg-slate-950/30 opacity-60"
                    >
                      <span className="font-semibold text-sm text-slate-400">
                        {p.Nickname}
                      </span>
                      <span className="text-xs text-slate-600">
                        {p.PlayerID}
                      </span>
                      <span className="ml-auto text-xs text-red-400 font-mono">
                        {p.Status}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* ── Confirm modal ── */}
        {confirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black text-slate-100 mb-3">
                Xác nhận loại bỏ
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Bạn sắp loại{" "}
                <strong className="text-white">{confirm.nickname}</strong> khỏi{" "}
                <strong className="text-white">{teamName}</strong>. Trạng thái
                sẽ thành{" "}
                <span className="text-red-400 font-mono text-xs">
                  TRANSFERRED_OUT
                </span>
                .
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2.5 text-sm font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => removePlayer(confirm.playerId)}
                  disabled={removing === confirm.playerId}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {removing === confirm.playerId
                    ? "Đang xóa..."
                    : "Xóa Khỏi Đội"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterViewer;
