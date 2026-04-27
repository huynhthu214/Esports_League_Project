import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const SeasonTeamForm = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  useEffect(() => {
    axiosClient.get("/seasons").then((r) => setSeasons(r.data.data || [])).catch(() => {});
    axiosClient.get("/teams").then((r) => setTeams(r.data.data || [])).catch(() => {});
  }, []);

  // Khi chọn mùa → load danh sách đội đã đăng ký
  useEffect(() => {
    if (!seasonId) { setRegisteredTeams([]); return; }
    setLoadingRegistered(true);
    axiosClient.get("/season-teams", { params: { seasonId } })
      .then((r) => setRegisteredTeams((r.data.data || []).map((t) => t.TeamID)))
      .catch(() => setRegisteredTeams([]))
      .finally(() => setLoadingRegistered(false));
  }, [seasonId]);

  const toggleTeam = (tid) => {
    setSelectedTeams((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seasonId || selectedTeams.length === 0) {
      setStatus({ type: "error", message: "Vui lòng chọn mùa giải và ít nhất 1 đội." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await axiosClient.post("/season-teams", { seasonId, teamIds: selectedTeams });
      setStatus({ type: "success", message: res.data.message || `✅ Đã đăng ký ${selectedTeams.length} đội vào mùa ${seasonId}!` });
      setSelectedTeams([]);
      // Reload danh sách đã đăng ký
      const r2 = await axiosClient.get("/season-teams", { params: { seasonId } });
      setRegisteredTeams((r2.data.data || []).map((t) => t.TeamID));
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Lỗi server." });
    } finally {
      setLoading(false);
    }
  };

  const unregistered = teams.filter((t) => !registeredTeams.includes(t.TeamID));

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase mb-2">
          🏟️ Đăng ký đội vào mùa giải
        </h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">
          Bước bắt buộc trước khi đăng ký Roster. Trigger sẽ chặn nếu đội chưa có trong SeasonTeams.
        </p>

        {status && (
          <div className={`mb-6 p-4 border rounded-xl text-sm font-medium ${
            status.type === "success"
              ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
              : "bg-red-900/20 border-red-500/30 text-red-400"
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-6">
          {/* Chọn mùa giải */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Mùa giải *
            </label>
            <select
              value={seasonId}
              onChange={(e) => { setSeasonId(e.target.value); setSelectedTeams([]); }}
              className="w-full bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">-- Chọn mùa giải --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} ({s.Status})
                </option>
              ))}
            </select>
          </div>

          {/* Danh sách đội đã đăng ký */}
          {seasonId && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                {loadingRegistered ? "Đang tải..." : `Đã đăng ký: ${registeredTeams.length} đội`}
              </p>
              {registeredTeams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {teams
                    .filter((t) => registeredTeams.includes(t.TeamID))
                    .map((t) => (
                      <span key={t.TeamID} className="px-3 py-1 bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 rounded-lg text-xs font-bold">
                        ✓ {t.TeamName}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Chọn đội chưa đăng ký */}
          {seasonId && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Chọn đội để thêm vào mùa *
              </label>
              {unregistered.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Tất cả đội đã được đăng ký vào mùa này.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {unregistered.map((team) => {
                    const checked = selectedTeams.includes(team.TeamID);
                    return (
                      <button
                        type="button"
                        key={team.TeamID}
                        onClick={() => toggleTeam(team.TeamID)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          checked
                            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-300"
                            : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                          checked ? "bg-yellow-500 border-yellow-400" : "border-slate-600"
                        }`}>
                          {checked && <span className="text-black text-xs font-black">✓</span>}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{team.ShortName}</div>
                          <div className="text-xs text-slate-500">{team.TeamName}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || selectedTeams.length === 0 || !seasonId}
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Đang đăng ký..." : `Đăng ký ${selectedTeams.length > 0 ? selectedTeams.length + " đội" : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeasonTeamForm;
