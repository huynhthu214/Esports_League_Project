import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { Info, Trophy, BarChart3 } from "lucide-react";

const STYLE = `
  @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  .dot-blink { animation: dot-blink 1.8s ease infinite; }
`;

// Danh sách tướng Liên Quân Mobile (pool phổ biến trong esports)
const LIEN_QUAN_HEROES = [
  // Tank / Support
  "Thane",
  "Baldum",
  "Lumburr",
  "Omega",
  "Grakk",
  "Ormarr",
  "Arum",
  "Teemee",
  "Cresht",
  "Rouie",
  "Gildur",
  "Kaja",
  "Alice",
  // Fighter / Bruiser
  "Zephys",
  "Nakroth",
  "Omen",
  "Skud",
  "Maloch",
  "Qi",
  "Florentino",
  "Riktor",
  "Aoi",
  "Chou",
  "Lu Bu",
  "Lauriel",
  "Tulen",
  "Hayate",
  "Veres",
  "Murad",
  "Wukong",
  "Kriknak",
  // Mage
  "Liliana",
  "Ignis",
  "Natalya",
  "Ishar",
  "Kahlii",
  "Dirak",
  "Mganga",
  "Zata",
  "Raz",
  "Elsu (mid)",
  "Veera",
  "Annette",
  "Harith",
  "Sophitia",
  "Aleister",
  // Marksman
  "Tel'Annas",
  "Violet",
  "Elsu",
  "Yorn",
  "Wisp",
  "Laville",
  "Mina",
  "Payna",
  "Slimz",
  "Astrid",
  // Assassin
  "Kil'groth",
  "Alucard",
  "Ryoma",
  "Taara",
  "Ino",
  "Butterfly",
  "Lindis",
  "Keera",
  "Paine",
  "D'Arcy",
  "Jinnar",
].sort();

const POSITIONS = ["Top", "Jungle", "Mid", "ADC", "Support"];

// Gold thực tế Liên Quân: 8,000 – 18,000 gold/trận tùy vị trí
const DEFAULT_GOLD_BY_POS = {
  Top: 12000,
  Jungle: 11000,
  Mid: 13000,
  ADC: 14000,
  Support: 8000,
};

const defaultPlayer = (pos) => ({
  player_id: "",
  position: pos,
  hero: "",
  kills: 0,
  deaths: 0,
  assists: 0,
  gold: DEFAULT_GOLD_BY_POS[pos] ?? 10000,
});
const defaultTeam = () => POSITIONS.map((p) => defaultPlayer(p));

const inp = "ui-input";
const sel = "ui-select";
const mini = "ui-input !rounded-lg !px-2 !py-1.5 !text-xs";

const MatchResultForm = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonTeams, setSeasonTeams] = useState([]);
  const [team1Roster, setTeam1Roster] = useState([]);
  const [team2Roster, setTeam2Roster] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    match_id: "",
    season_id: "",
    team1_id: "",
    team2_id: "",
    winner: "1",
    team1_score: 2,
    team2_score: 1,
    match_date: new Date().toISOString().split("T")[0],
    venue: "",
    format: "BO3",
  });
  const [team1Players, setTeam1Players] = useState(defaultTeam());
  const [team2Players, setTeam2Players] = useState(defaultTeam());

  // ── BƯỚC 1: Mùa — smart default ─────────────────────────────────
  const fetchSeasons = useCallback(() => {
    axiosClient
      .get("/admin/seasons")
      .then((r) => {
        const list = r.data?.data || [];
        setSeasons(list);
        const active = list.find((s) => s.Status === "ACTIVE") || list[0];
        if (active) setForm((f) => ({ ...f, season_id: active.SeasonID }));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // ── BƯỚC 2: Khi mùa đổi → load đội trong mùa ────────────────────
  const fetchSeasonTeams = useCallback(() => {
    if (!form.season_id) {
      setSeasonTeams([]);
      return;
    }
    setForm((f) => ({ ...f, team1_id: "", team2_id: "", match_id: "" }));
    setTeam1Roster([]);
    setTeam2Roster([]);
    setTeam1Players(defaultTeam());
    setTeam2Players(defaultTeam());
    axiosClient
      .get("/admin/season-teams", { params: { seasonId: form.season_id } })
      .then((r) => setSeasonTeams(r.data?.data || []))
      .catch(() => setSeasonTeams([]));
  }, [form.season_id]);
  useEffect(() => {
    fetchSeasonTeams();
  }, [fetchSeasonTeams]);

  // ── BƯỚC 3: Khi team1 đổi → load roster đội 1 ───────────────────
  useEffect(() => {
    if (!form.team1_id || !form.season_id) {
      setTeam1Roster([]);
      return;
    }
    axiosClient
      .get(`/admin/rosters/${form.team1_id}`, {
        params: { seasonId: form.season_id },
      })
      .then((r) => {
        const active = (r.data?.data || []).filter(
          (p) => p.Status === "ACTIVE",
        );
        setTeam1Roster(active);
        // Auto-fill player_id vào từng slot vị trí
        setTeam1Players(
          POSITIONS.map((pos) => {
            const match = active.find((p) => p.Position === pos);
            return { ...defaultPlayer(pos), player_id: match?.PlayerID || "" };
          }),
        );
      })
      .catch(() => {
        setTeam1Roster([]);
        setTeam1Players(defaultTeam());
      });
  }, [form.team1_id, form.season_id]);

  // ── BƯỚC 4: Khi team2 đổi → load roster đội 2 ───────────────────
  useEffect(() => {
    if (!form.team2_id || !form.season_id) {
      setTeam2Roster([]);
      return;
    }
    axiosClient
      .get(`/admin/rosters/${form.team2_id}`, {
        params: { seasonId: form.season_id },
      })
      .then((r) => {
        const active = (r.data?.data || []).filter(
          (p) => p.Status === "ACTIVE",
        );
        setTeam2Roster(active);
        setTeam2Players(
          POSITIONS.map((pos) => {
            const match = active.find((p) => p.Position === pos);
            return { ...defaultPlayer(pos), player_id: match?.PlayerID || "" };
          }),
        );
      })
      .catch(() => {
        setTeam2Roster([]);
        setTeam2Players(defaultTeam());
      });
  }, [form.team2_id, form.season_id]);

  // Auto match_id + auto winner tu ti so
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto match_id
      if (["season_id", "team1_id", "team2_id", "match_date"].includes(name)) {
        const sid = name === "season_id" ? value : prev.season_id;
        const t1 = name === "team1_id" ? value : prev.team1_id;
        const t2 = name === "team2_id" ? value : prev.team2_id;
        const date = name === "match_date" ? value : prev.match_date;
        if (sid && t1 && t2)
          next.match_id = `${sid}_${t1}vs${t2}_${date.replace(/-/g, "")}`;
      }
      // Auto winner tu ti so
      if (["team1_score", "team2_score"].includes(name)) {
        const s1 = Number(name === "team1_score" ? value : prev.team1_score);
        const s2 = Number(name === "team2_score" ? value : prev.team2_score);
        if (s1 !== s2) next.winner = s1 > s2 ? "1" : "2";
      }
      return next;
    });
  };

  const updatePlayer = (teamNum, idx, field, value) => {
    const setter = teamNum === 1 ? setTeam1Players : setTeam2Players;
    setter((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              [field]: ["kills", "deaths", "assists"].includes(field)
                ? parseInt(value) || 0
                : field === "gold"
                  ? parseInt(value) || 0 // gold co the den 18000+
                  : value,
            }
          : p,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (form.team1_id === form.team2_id) {
      setStatus({
        type: "error",
        text: "❌ Đội 1 và Đội 2 không được giống nhau!",
      });
      return;
    }
    setLoading(true);
    // Winner luôn được tính từ tỉ số tại lúc submit, không tin vào state form.winner
    const s1 = Number(form.team1_score);
    const s2 = Number(form.team2_score);
    if (s1 === s2) {
      setStatus({
        type: "error",
        text: "❌ Tỉ số hòa không hợp lệ trong thể thức BO!",
      });
      setLoading(false);
      return;
    }
    const derivedWinner = s1 > s2 ? "1" : "2";
    const winTeamId = derivedWinner === "1" ? form.team1_id : form.team2_id;
    const loseTeamId = derivedWinner === "1" ? form.team2_id : form.team1_id;
    const winScore = derivedWinner === "1" ? s1 : s2;
    const loseScore = derivedWinner === "1" ? s2 : s1;
    const payload = {
      match_id: form.match_id || `M_${Date.now()}`,
      season_id: form.season_id,
      match_date: new Date(form.match_date).toISOString(),
      teams: [
        {
          team_id: form.team1_id,
          result: derivedWinner === "1" ? "WIN" : "LOSS",
          score: s1,
          players: team1Players,
        },
        {
          team_id: form.team2_id,
          result: derivedWinner === "2" ? "WIN" : "LOSS",
          score: s2,
          players: team2Players,
        },
      ],
      winner_team_id: winTeamId,
      loser_team_id: loseTeamId,
      win_score: winScore,
      lose_score: loseScore,
      venue: form.venue,
      format: form.format,
    };
    try {
      await axiosClient.post("/admin/matches", payload);
      setStatus({
        type: "success",
        text: `✅ Nhập kết quả thành công! Match: ${payload.match_id}`,
      });
      setForm((f) => ({
        ...f,
        match_id: "",
        team1_id: "",
        team2_id: "",
        venue: "",
      }));
      setTeam1Players(defaultTeam());
      setTeam2Players(defaultTeam());
    } catch (err) {
      setStatus({
        type: "error",
        text: `❌ Lỗi: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const team1Name =
    seasonTeams.find((t) => t.TeamID === form.team1_id)?.TeamName || "Đội 1";
  const team2Name =
    seasonTeams.find((t) => t.TeamID === form.team2_id)?.TeamName || "Đội 2";
  // Đội 2 không bao gồm đội 1
  const team2Options = seasonTeams.filter((t) => t.TeamID !== form.team1_id);

  const PlayerRow = ({ teamNum, idx, player, roster }) => {
    const setter = (field, val) => updatePlayer(teamNum, idx, field, val);
    const posRoster = roster.filter((r) => r.Position === player.position);
    return (
      <div className="grid grid-cols-8 gap-2 items-center py-2 border-b border-slate-800/60 last:border-0">
        {/* Cột 1-2: Chọn tuyển thủ */}
        <div className="col-span-2">
          <select
            value={player.player_id}
            onChange={(e) => setter("player_id", e.target.value)}
            className={mini}
          >
            <option value="">-- Chọn --</option>
            {posRoster.map((r) => (
              <option key={r.PlayerID} value={r.PlayerID}>
                {r.Nickname}
              </option>
            ))}
          </select>
        </div>

        {/* Cột 3: Dropdown tướng Liên Quân */}
        <select
          className={mini}
          value={player.hero}
          onChange={(e) => setter("hero", e.target.value)}
        >
          <option value="">-- Tướng --</option>
          {LIEN_QUAN_HEROES.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        {/* K D A */}
        <input
          className={mini}
          type="number"
          min="0"
          max="30"
          placeholder="K"
          value={player.kills}
          onChange={(e) => setter("kills", e.target.value)}
        />
        <input
          className={mini}
          type="number"
          min="0"
          max="30"
          placeholder="D"
          value={player.deaths}
          onChange={(e) => setter("deaths", e.target.value)}
        />
        <input
          className={mini}
          type="number"
          min="0"
          max="30"
          placeholder="A"
          value={player.assists}
          onChange={(e) => setter("assists", e.target.value)}
        />

        {/* Gold: đầu vào thực tế, step 100 */}
        <input
          className={mini}
          type="number"
          min="5000"
          max="25000"
          step="100"
          title="Gold trong trận (Liên Quân: ~8k–18k)"
          value={player.gold}
          onChange={(e) => setter("gold", e.target.value)}
        />

        <div className="text-xs text-slate-500 text-center font-medium">
          {player.position}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <style>{STYLE}</style>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase mb-1">
          Nhập Kết Quả Trận Đấu
        </h1>

        {status && (
          <div
            className={`mb-6 p-4 border rounded-xl text-sm font-medium ${status.type === "success" ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}
          >
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ── Thông tin trận ── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Thông tin trận đấu
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Mùa giải *
                </label>
                <select
                  name="season_id"
                  value={form.season_id}
                  onChange={handleFormChange}
                  required
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
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Ngày thi đấu *
                </label>
                <input
                  type="date"
                  name="match_date"
                  value={form.match_date}
                  onChange={handleFormChange}
                  required
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Format
                </label>
                <select
                  name="format"
                  value={form.format}
                  onChange={handleFormChange}
                  className={sel}
                >
                  {["BO1", "BO3", "BO5"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Địa điểm
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleFormChange}
                  placeholder="Arena NEXUS"
                  className={inp}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">
                  Mã trận (tự tạo)
                </label>
                <input
                  type="text"
                  name="match_id"
                  value={form.match_id}
                  onChange={handleFormChange}
                  placeholder="Tự điền khi chọn 2 đội"
                  className={inp + " font-mono text-xs text-slate-400"}
                />
              </div>
            </div>
          </div>

          {/* ── Kết quả ── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Kết quả trận đấu
            </h3>
            <div className="grid grid-cols-5 gap-4 items-end">
              {/* Đội 1 */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">
                  Đội 1 *
                  {form.season_id && (
                    <span className="ml-1 text-purple-400">
                      ({seasonTeams.length} đội)
                    </span>
                  )}
                </label>
                <select
                  name="team1_id"
                  value={form.team1_id}
                  onChange={handleFormChange}
                  required
                  disabled={!form.season_id}
                  className={sel}
                >
                  <option value="">
                    {form.season_id ? "-- Chọn đội 1 --" : "← Chọn mùa trước"}
                  </option>
                  {seasonTeams.map((t) => (
                    <option key={t.TeamID} value={t.TeamID}>
                      {t.TeamName}
                    </option>
                  ))}
                </select>
              </div>

              {/* VS + score + winner */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-slate-500 font-black text-lg">VS</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="team1_score"
                    value={form.team1_score}
                    onChange={handleFormChange}
                    min="0"
                    max="5"
                    className="w-12 text-center bg-slate-800 border border-slate-700 text-white rounded-lg py-1.5 text-sm font-bold focus:outline-none"
                  />
                  <span className="text-slate-600">:</span>
                  <input
                    type="number"
                    name="team2_score"
                    value={form.team2_score}
                    onChange={handleFormChange}
                    min="0"
                    max="5"
                    className="w-12 text-center bg-slate-800 border border-slate-700 text-white rounded-lg py-1.5 text-sm font-bold focus:outline-none"
                  />
                </div>
                {/* Winner badge: tự động phân từ tỉ số */}
                {(() => {
                  const s1 = Number(form.team1_score);
                  const s2 = Number(form.team2_score);
                  const winnerName =
                    s1 > s2
                      ? seasonTeams.find((t) => t.TeamID === form.team1_id)
                          ?.ShortName || "Đội 1"
                      : s2 > s1
                        ? seasonTeams.find((t) => t.TeamID === form.team2_id)
                            ?.ShortName || "Đội 2"
                        : null;
                  return winnerName ? (
                    <div className="text-xs bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-2 font-black text-center">
                      {winnerName} thắng
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 text-center">
                      Nhập tỉ số ↑
                    </div>
                  );
                })()}
              </div>

              {/* Đội 2 */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">
                  Đội 2 *
                  {form.team1_id && (
                    <span className="ml-1 text-purple-400">
                      ({team2Options.length} đội)
                    </span>
                  )}
                </label>
                <select
                  name="team2_id"
                  value={form.team2_id}
                  onChange={handleFormChange}
                  required
                  disabled={!form.team1_id}
                  className={sel}
                >
                  <option value="">
                    {form.team1_id ? "-- Chọn đội 2 --" : "← Chọn đội 1 trước"}
                  </option>
                  {team2Options.map((t) => (
                    <option key={t.TeamID} value={t.TeamID}>
                      {t.TeamName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Stats đội 1 ── */}
          {form.team1_id && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Stats — {team1Name}
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Player tự điền theo roster · chỉnh tay nếu cần
              </p>
              <div className="grid grid-cols-8 gap-2 mb-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <div className="col-span-2">Tuyển thủ</div>
                <div>Tướng</div>
                <div>K</div>
                <div>D</div>
                <div>A</div>
                <div title="Gold trong trận (8k–18k)">Gold</div>
                <div>Vị trí</div>
              </div>
              {team1Players.map((p, i) => (
                <PlayerRow
                  key={i}
                  teamNum={1}
                  idx={i}
                  player={p}
                  roster={team1Roster}
                />
              ))}
            </div>
          )}

          {/* ── Stats đội 2 ── */}
          {form.team2_id && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Stats — {team2Name}
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Player tự điền theo roster · chỉnh tay nếu cần
              </p>
              <div className="grid grid-cols-8 gap-2 mb-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <div className="col-span-2">Tuyển thủ</div>
                <div>Tướng</div>
                <div>K</div>
                <div>D</div>
                <div>A</div>
                <div title="Gold trong trận (8k–18k)">Gold</div>
                <div>Vị trí</div>
              </div>
              {team2Players.map((p, i) => (
                <PlayerRow
                  key={i}
                  teamNum={2}
                  idx={i}
                  player={p}
                  roster={team2Roster}
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || !form.team1_id || !form.team2_id || !form.season_id
            }
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg py-4 text-sm font-black tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "⏳ Đang xử lý..." : "GHI NHẬN KẾT QUẢ TRẬN ĐẤU"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchResultForm;
