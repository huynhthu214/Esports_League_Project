import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITION_ORDER = ["Top", "Jungle", "Mid", "ADC", "Support"];
const POSITION_COLOR = {
  Top: "bg-red-500/20 text-red-400 border border-red-500/30",
  Jungle: "bg-green-500/20 text-green-400 border border-green-500/30",
  Mid: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  ADC: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Support: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

const RosterViewer = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    // Call API thật:
    axiosClient
      .get("/admin/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
  }, []);

  const fetchRoster = async () => {
    if (!seasonId || !teamId) return;
    setLoading(true);
    setError("");
    setRoster([]);
    try {
      // Call API thật:
      const res = await axiosClient.get(`/rosters/${teamId}`, {
        params: { seasonId },
      });
      setRoster(res.data.data || []);
    } catch {
      setError("Không thể tải roster. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (playerId) => {
    setRemoving(playerId);
    try {
      // Call API thật:
      await axiosClient.patch(`/rosters/remove`, {
        playerId,
        teamId,
        seasonId,
      });
      setRoster((prev) => prev.filter((p) => p.PlayerID !== playerId));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa thành viên.");
    } finally {
      setRemoving(null);
    }
  };

  const activeRoster = roster.filter((p) => p.Status === "ACTIVE");
  const inactiveRoster = roster.filter((p) => p.Status !== "ACTIVE");
  const teamName = teams.find((t) => t.TeamID === teamId)?.TeamName || teamId;

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans relative">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-2">
          👁️ Quản lý Roster
        </h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">
          Theo dõi và loại bỏ thành viên (Chuyển trạng thái TRANSFERRED_OUT)
        </p>

        <div className="flex flex-wrap gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <select
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              setRoster([]);
            }}
            className="flex-1 bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Chọn mùa giải --</option>
            {seasons.map((s) => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.SeasonName}
              </option>
            ))}
          </select>
          <select
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setRoster([]);
            }}
            className="flex-1 bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Chọn đội --</option>
            {teams.map((t) => (
              <option key={t.TeamID} value={t.TeamID}>
                {t.TeamName}
              </option>
            ))}
          </select>
          <button
            onClick={fetchRoster}
            disabled={!seasonId || !teamId || loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            {loading ? "Đang tải..." : "Xem Roster"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 border rounded-xl text-sm font-medium bg-red-900/20 border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {roster.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {teamName}
                </h2>
                <p className="text-sm text-cyan-400 mt-1">
                  {activeRoster.length} thành viên ACTIVE
                </p>
              </div>
              <span
                className={`text-sm font-bold px-4 py-1.5 rounded-lg border ${activeRoster.length >= 10 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}
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
                      "Hành động",
                    ].map((h) => (
                      <th key={h} className="px-5 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
                  {activeRoster
                    .sort(
                      (a, b) =>
                        POSITION_ORDER.indexOf(a.Position) -
                        POSITION_ORDER.indexOf(b.Position),
                    )
                    .map((p) => (
                      <tr
                        key={p.PlayerID}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-4 font-bold text-slate-200">
                          {p.Nickname}{" "}
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
                          {p.AvgKDA}
                        </td>
                        <td className="px-5 py-4 text-amber-400 font-medium">
                          {p.AvgGPM}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {p.WinRate}%
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
          </div>
        )}

        {confirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <h3 className="text-xl font-black text-slate-100 mb-3">
                Xác nhận loại bỏ
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Bạn sắp loại <strong>{confirm.nickname}</strong> khỏi{" "}
                <strong>{teamName}</strong>. Trạng thái sẽ thành{" "}
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
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50 transition-colors"
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
