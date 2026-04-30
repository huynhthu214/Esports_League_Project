import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITIONS = ["Top", "Jungle", "Mid", "ADC", "Support"];

const defaultPlayer = (pos) => ({
  player_id: "",
  nickname: "",
  position: pos,
  hero: "",
  kills: 0,
  deaths: 0,
  assists: 0,
  gold: 0,
});

const defaultTeamPlayers = () => POSITIONS.map((pos) => defaultPlayer(pos));

const MatchResultForm = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    match_id: "",
    season_id: "",
    team1_id: "",
    team2_id: "",
    winner: "1", // '1' hoặc '2'
    team1_score: 2,
    team2_score: 1,
    match_date: new Date().toISOString().split("T")[0],
    venue: "",
    format: "BO3",
  });

  const [team1Players, setTeam1Players] = useState(defaultTeamPlayers());
  const [team2Players, setTeam2Players] = useState(defaultTeamPlayers());

  useEffect(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/players")
      .then((r) => setPlayers(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto generate match_id
    if (name === "season_id" || name === "team1_id" || name === "team2_id") {
      const sid = name === "season_id" ? value : form.season_id;
      const t1 = name === "team1_id" ? value : form.team1_id;
      const t2 = name === "team2_id" ? value : form.team2_id;
      if (sid && t1 && t2) {
        const dateStr = form.match_date.replace(/-/g, "");
        setForm((prev) => ({
          ...prev,
          [name]: value,
          match_id: `${sid}_${t1}vs${t2}_${dateStr}`,
        }));
        return;
      }
    }
  };

  const updatePlayer = (teamNum, idx, field, value) => {
    const setter = teamNum === 1 ? setTeam1Players : setTeam2Players;
    setter((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              [field]:
                field === "kills" ||
                field === "deaths" ||
                field === "assists" ||
                field === "gold"
                  ? parseInt(value) || 0
                  : value,
            }
          : p,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    if (form.team1_id === form.team2_id) {
      setStatus({
        type: "error",
        text: "❌ Đội 1 và Đội 2 không được giống nhau!",
      });
      setLoading(false);
      return;
    }

    try {
      const winnerTeamId = form.winner === "1" ? form.team1_id : form.team2_id;
      const loserTeamId = form.winner === "1" ? form.team2_id : form.team1_id;

      const payload = {
        match_id: form.match_id,
        season_id: form.season_id,
        match_date: form.match_date,
        venue: form.venue,
        format: form.format,
        team1_id: form.team1_id,
        team2_id: form.team2_id,
        team1_score: parseInt(form.team1_score),
        team2_score: parseInt(form.team2_score),
        winner_team_id: winnerTeamId,
        teams: [
          {
            team_id: form.team1_id,
            result: form.winner === "1" ? "WIN" : "LOSS",
            players: team1Players
              .filter((p) => p.player_id)
              .map((p) => ({
                player_id: p.player_id,
                nickname: p.nickname,
                position: p.position,
                hero: p.hero,
                kills: parseInt(p.kills) || 0,
                deaths: parseInt(p.deaths) || 0,
                assists: parseInt(p.assists) || 0,
                gold: parseInt(p.gold) || 0,
              })),
          },
          {
            team_id: form.team2_id,
            result: form.winner === "2" ? "WIN" : "LOSS",
            players: team2Players
              .filter((p) => p.player_id)
              .map((p) => ({
                player_id: p.player_id,
                nickname: p.nickname,
                position: p.position,
                hero: p.hero,
                kills: parseInt(p.kills) || 0,
                deaths: parseInt(p.deaths) || 0,
                assists: parseInt(p.assists) || 0,
                gold: parseInt(p.gold) || 0,
              })),
          },
        ],
      };

      const response = await axiosClient.post("/matches", payload);
      setStatus({
        type: "success",
        text: `✅ ${response.data.message || "Nhập kết quả thành công!"}`,
      });
      // Reset form
      setTeam1Players(defaultTeamPlayers());
      setTeam2Players(defaultTeamPlayers());
    } catch (error) {
      setStatus({
        type: "error",
        text: `❌ Lỗi: ${error.response?.data?.error || error.response?.data?.message || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const teamName1 =
    teams.find((t) => t.TeamID === form.team1_id)?.TeamName || "Đội 1";
  const teamName2 =
    teams.find((t) => t.TeamID === form.team2_id)?.TeamName || "Đội 2";

  const PlayerRow = ({ teamNum, idx, player }) => {
    const posByPos = players.filter((p) => p.Position === player.position);
    return (
      <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
        <td className="px-3 py-3">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-md ${
              player.position === "Top"
                ? "bg-red-500/20 text-red-400"
                : player.position === "Jungle"
                  ? "bg-green-500/20 text-green-400"
                  : player.position === "Mid"
                    ? "bg-blue-500/20 text-blue-400"
                    : player.position === "ADC"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {player.position}
          </span>
        </td>
        <td className="px-3 py-3">
          <select
            value={player.player_id}
            onChange={(e) => {
              const selected = players.find(
                (p) => p.PlayerID === e.target.value,
              );
              updatePlayer(teamNum, idx, "player_id", e.target.value);
              if (selected)
                updatePlayer(teamNum, idx, "nickname", selected.Nickname);
            }}
            className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Chọn tuyển thủ --</option>
            {posByPos.map((p) => (
              <option key={p.PlayerID} value={p.PlayerID}>
                {p.Nickname} ({p.PlayerID})
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-3">
          <input
            type="text"
            placeholder="Tên tướng"
            value={player.hero}
            onChange={(e) => updatePlayer(teamNum, idx, "hero", e.target.value)}
            className="w-24 bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          />
        </td>
        {["kills", "deaths", "assists", "gold"].map((field) => (
          <td key={field} className="px-2 py-3">
            <input
              type="number"
              min="0"
              value={player[field]}
              onChange={(e) =>
                updatePlayer(teamNum, idx, field, e.target.value)
              }
              className={`w-16 bg-slate-950/80 border rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none ${
                field === "kills"
                  ? "border-emerald-700/50 text-emerald-400 focus:border-emerald-500"
                  : field === "deaths"
                    ? "border-red-700/50 text-red-400 focus:border-red-500"
                    : field === "assists"
                      ? "border-cyan-700/50 text-cyan-400 focus:border-cyan-500"
                      : "border-amber-700/50 text-amber-400 focus:border-amber-500"
              }`}
            />
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-2 drop-shadow-sm">
          🎮 Nhập Kết Quả Trận Đấu
        </h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">
          Điền thông tin trận đấu — hệ thống tự đồng bộ vào MongoDB & SQL Server
        </p>

        {status && (
          <div
            className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
              status.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* === THÔNG TIN TRẬN === */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">
              📋 Thông tin trận đấu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Mùa giải *
                </label>
                <select
                  name="season_id"
                  value={form.season_id}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Chọn mùa giải --</option>
                  {seasons.map((s) => (
                    <option key={s.SeasonID} value={s.SeasonID}>
                      {s.SeasonName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Ngày thi đấu *
                </label>
                <input
                  type="date"
                  name="match_date"
                  value={form.match_date}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Format
                </label>
                <select
                  name="format"
                  value={form.format}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
                >
                  {["BO1", "BO3", "BO5"].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Địa điểm
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleFormChange}
                  placeholder="VD: Nhà thi đấu Phú Thọ"
                  className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Mã trận (tự tạo)
                </label>
                <input
                  type="text"
                  name="match_id"
                  value={form.match_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, match_id: e.target.value }))
                  }
                  placeholder="VD: SS2025_SGDvsHNL_20250601"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          {/* === KẾT QUẢ === */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">
              🏆 Kết quả trận đấu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Đội 1 *
                </label>
                <select
                  name="team1_id"
                  value={form.team1_id}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-950/80 border border-cyan-700/50 text-cyan-300 rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Chọn đội 1 --</option>
                  {teams.map((t) => (
                    <option key={t.TeamID} value={t.TeamID}>
                      {t.TeamName} ({t.ShortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-slate-500 font-black italic text-lg">
                  VS
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    name="team1_score"
                    value={form.team1_score}
                    onChange={handleFormChange}
                    className="w-14 text-center bg-slate-950/80 border border-cyan-700/50 text-cyan-300 font-black text-xl rounded-lg px-2 py-2 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-500 font-black">:</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    name="team2_score"
                    value={form.team2_score}
                    onChange={handleFormChange}
                    className="w-14 text-center bg-slate-950/80 border border-rose-700/50 text-rose-300 font-black text-xl rounded-lg px-2 py-2 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Đội 2 *
                </label>
                <select
                  name="team2_id"
                  value={form.team2_id}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-950/80 border border-rose-700/50 text-rose-300 rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Chọn đội 2 --</option>
                  {teams.map((t) => (
                    <option key={t.TeamID} value={t.TeamID}>
                      {t.TeamName} ({t.ShortName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chọn đội thắng */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Đội chiến thắng *
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.winner === "1" ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 hover:border-slate-600"}`}
                >
                  <input
                    type="radio"
                    name="winner"
                    value="1"
                    checked={form.winner === "1"}
                    onChange={handleFormChange}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.winner === "1" ? "border-cyan-400" : "border-slate-600"}`}
                  >
                    {form.winner === "1" && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm ${form.winner === "1" ? "text-cyan-300" : "text-slate-400"}`}
                  >
                    🏆{" "}
                    {form.team1_id
                      ? teams.find((t) => t.TeamID === form.team1_id)
                          ?.ShortName || "Đội 1"
                      : "Đội 1"}{" "}
                    thắng
                  </span>
                </label>
                <label
                  className={`flex-1 flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.winner === "2" ? "border-rose-500 bg-rose-500/10" : "border-slate-700 hover:border-slate-600"}`}
                >
                  <input
                    type="radio"
                    name="winner"
                    value="2"
                    checked={form.winner === "2"}
                    onChange={handleFormChange}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.winner === "2" ? "border-rose-400" : "border-slate-600"}`}
                  >
                    {form.winner === "2" && (
                      <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm ${form.winner === "2" ? "text-rose-300" : "text-slate-400"}`}
                  >
                    🏆{" "}
                    {form.team2_id
                      ? teams.find((t) => t.TeamID === form.team2_id)
                          ?.ShortName || "Đội 2"
                      : "Đội 2"}{" "}
                    thắng
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* === STATS TUYỂN THỦ === */}
          {[1, 2].map((teamNum) => {
            const teamPlayers = teamNum === 1 ? team1Players : team2Players;
            const teamId = teamNum === 1 ? form.team1_id : form.team2_id;
            const tName = teamNum === 1 ? teamName1 : teamName2;
            const isWinner =
              (teamNum === 1 && form.winner === "1") ||
              (teamNum === 2 && form.winner === "2");
            return (
              <div
                key={teamNum}
                className={`bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border shadow-lg ${isWinner ? "border-emerald-700/40" : "border-slate-800"}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <h2
                    className={`text-sm font-black uppercase tracking-widest ${teamNum === 1 ? "text-cyan-400" : "text-rose-400"}`}
                  >
                    👤 Tuyển thủ {tName}
                  </h2>
                  {isWinner && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                      🏆 Thắng
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/80">
                      <tr>
                        {[
                          "Vị trí",
                          "Tuyển thủ",
                          "Tướng",
                          "Kills",
                          "Deaths",
                          "Assists",
                          "Gold",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamPlayers.map((p, idx) => (
                        <PlayerRow
                          key={idx}
                          teamNum={teamNum}
                          idx={idx}
                          player={p}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading ||
              !form.season_id ||
              !form.team1_id ||
              !form.team2_id ||
              !form.match_id
            }
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl py-4 text-sm font-black tracking-wide uppercase shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? "⏳ Đang đồng bộ..." : "🚀 Lưu Kết Quả & Đồng Bộ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchResultForm;
