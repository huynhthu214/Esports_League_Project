import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITIONS = ["Top", "Jungle", "Mid", "ADC", "Support"];

const RosterForm = () => {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ teamId: "", seasonId: "", playerIds: [] });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Call API thật:
    axiosClient.get("/teams").then((r) => setTeams(r.data.data || [])).catch(() => {});
    axiosClient.get("/seasons").then((r) => setSeasons(r.data.data || [])).catch(() => {});
    axiosClient.get("/players").then((r) => setPlayers(r.data.data || [])).catch(() => {});
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
      // Call API thật:
      const res = await axiosClient.post("/rosters", {
        teamId: form.teamId,
        seasonId: form.seasonId,
        playerIds: form.playerIds,
      });
      setStatus({ type: "success", message: res.data.message || "Đăng ký Roster thành công!" });
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

  const byPos = (pos) => players.filter((p) => p.Position === pos);

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 uppercase mb-2">
          👥 Đăng ký Roster
        </h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">
          Tối đa 10 người/đội. Trigger tự động kiểm tra tính hợp lệ tuyển thủ trong mùa.
        </p>

        {status && (
          <div className={`mb-6 p-4 border rounded-xl text-sm font-medium ${status.type === "success" ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : status.type === "trigger" ? "bg-amber-900/20 border-amber-500/30 text-amber-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
            {status.type === "trigger" && <strong>⚠️ Trigger vi phạm: </strong>}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Đội tuyển</label>
              <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Chọn đội --</option>
                {teams.map((t) => <option key={t.TeamID} value={t.TeamID}>{t.TeamName} ({t.ShortName})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mùa giải</label>
              <select value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })} required className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Chọn mùa giải --</option>
                {seasons.map((s) => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Chọn tuyển thủ — <span className="text-cyan-400">{form.playerIds.length}</span> đã chọn (cần 5–10)
            </label>
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/50">
              {POSITIONS.map((pos) => (
                <div key={pos} className="p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{pos}</p>
                  <div className="flex flex-wrap gap-3">
                    {byPos(pos).map((p) => {
                      const checked = form.playerIds.includes(p.PlayerID);
                      return (
                        <label
                          key={p.PlayerID}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all duration-200 ${checked ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"}`}
                        >
                          <input type="checkbox" className="hidden" checked={checked} onChange={() => togglePlayer(p.PlayerID)} />
                          {p.Nickname} <span className="text-xs opacity-50">({p.PlayerID})</span>
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
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? "Đang đăng ký..." : `Ghi Nhận Roster (${form.playerIds.length} tuyển thủ)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RosterForm;
