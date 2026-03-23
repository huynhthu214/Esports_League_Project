// src/pages/admin/RosterForm.jsx - (THÚY VI)
// POST /api/rosters → sp_RegisterTeamToSeason
// Body: { teamId (varchar10=ShortName), seasonId, playerIds: ["P001",...] }
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const RosterForm = () => {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ teamId: "", seasonId: "", playerIds: [] });
  const [status, setStatus] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load dropdown data từ các GET endpoints
    axiosClient
      .get("/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/players")
      .then((r) => setPlayers(r.data.data || []))
      .catch(() => {});
  }, []);

  const togglePlayer = (pid) =>
    setForm((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(pid)
        ? prev.playerIds.filter((p) => p !== pid)
        : [...prev.playerIds, pid],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await axiosClient.post("/rosters", {
        teamId: form.teamId,
        seasonId: form.seasonId,
        playerIds: form.playerIds, // ["P001","P002",...]
      });
      setStatus({ type: "success", message: res.data.message });
      setForm({ teamId: "", seasonId: "", playerIds: [] });
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

  // Lọc player theo position cho dễ chọn
  const POSITIONS = ["Top", "Jungle", "Mid", "ADC", "Support"];
  const byPos = (pos) => players.filter((p) => p.Position === pos);

  const statusStyle = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-600",
    trigger: "bg-yellow-50 border-yellow-300 text-yellow-800",
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">
        Đăng ký Roster
      </h1>
      <p className="text-xs text-gray-400 mb-5">
        Trigger tự kiểm tra: 1 tuyển thủ không được ACTIVE ở 2 đội cùng mùa ·
        Tối đa 10 người/đội
      </p>

      {status && (
        <div
          className={`mb-4 p-3 border rounded-lg text-sm ${statusStyle[status.type]}`}
        >
          {status.type === "trigger" && <strong>⚠️ Trigger vi phạm: </strong>}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Đội tuyển (TeamID)
            </label>
            <select
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">-- Chọn đội --</option>
              {teams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName} ({t.ShortName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mùa giải</label>
            <select
              value={form.seasonId}
              onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">-- Chọn mùa giải --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chọn player theo vị trí */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Chọn tuyển thủ — {form.playerIds.length} đã chọn (cần 5–10)
          </label>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {POSITIONS.map((pos) => (
              <div key={pos} className="p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {pos}
                </p>
                <div className="flex flex-wrap gap-2">
                  {byPos(pos).map((p) => {
                    const checked = form.playerIds.includes(p.PlayerID);
                    return (
                      <label
                        key={p.PlayerID}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs cursor-pointer transition-colors ${
                          checked
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => togglePlayer(p.PlayerID)}
                        />
                        {p.Nickname}
                        <span className="text-gray-400">({p.PlayerID})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || form.playerIds.length < 5}
          className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? "Đang đăng ký..."
            : `Đăng ký Roster (${form.playerIds.length} tuyển thủ)`}
        </button>
      </form>
    </div>
  );
};

export default RosterForm;
