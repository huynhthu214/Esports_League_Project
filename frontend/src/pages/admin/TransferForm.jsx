import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

const sel = "ui-select";

const TransferForm = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [teamRosterPlayers, setTeamRosterPlayers] = useState([]); // player ACTIVE trong đội+mùa (lọc giống rosterform)
  const [seasonTeams, setSeasonTeams] = useState([]); // đội trong mùa
  const [playerCtx, setPlayerCtx] = useState(null); // context panel
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({
    playerId: "",
    fromTeamId: "",
    toTeamId: "",
    transferFee: "",
    reason: "",
    approvedBy: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── BƯỚC 1: Mùa giải ─────────────────────────────────────────────
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

  // ── BƯỚC 2: Khi seasonId đổi → load đội thuộc mùa ────────────────
  const fetchSeasonTeams = useCallback(() => {
    if (!seasonId) {
      setSeasonTeams([]);
      setForm((f) => ({ ...f, playerId: "", fromTeamId: "", toTeamId: "" }));
      setTeamRosterPlayers([]);
      setPlayerCtx(null);
      return;
    }
    setLoadError("");
    setLoadingTeams(true);
    setForm((f) => ({ ...f, playerId: "", fromTeamId: "", toTeamId: "" }));
    setTeamRosterPlayers([]);
    setPlayerCtx(null);
    axiosClient
      .get("/admin/season-teams", { params: { seasonId } })
      .then((r) => setSeasonTeams(r.data?.data || []))
      .catch((e) => {
        setSeasonTeams([]);
        setLoadError(
          e.response?.data?.message || "Không tải được danh sách đội theo mùa.",
        );
      })
      .finally(() => setLoadingTeams(false));
  }, [seasonId]);
  useEffect(() => {
    fetchSeasonTeams();
  }, [fetchSeasonTeams]);

  // ── BƯỚC 3: Khi chọn đội nguồn (fromTeamId) → load roster ACTIVE ──
  const fetchTeamRosterPlayers = useCallback(() => {
    if (!seasonId || !form.fromTeamId) {
      setTeamRosterPlayers([]);
      setForm((f) => ({ ...f, playerId: "" }));
      setPlayerCtx(null);
      return;
    }
    setLoadError("");
    setLoadingPlayers(true);
    setTeamRosterPlayers([]);
    setForm((f) => ({ ...f, playerId: "" }));
    setPlayerCtx(null);

    axiosClient
      .get(`/admin/rosters/${form.fromTeamId}`, { params: { seasonId } })
      .then((r) => {
        const rows = r.data?.data || [];
        const active = rows.filter((x) => x.Status === "ACTIVE");
        setTeamRosterPlayers(active);
      })
      .catch(async (e) => {
        // Fallback: nếu API rosters/team lỗi vì lý do nào đó, vẫn cho admin chọn player theo danh sách Players
        setLoadError(
          e.response?.data?.message ||
            "Không tải được roster của đội. Bạn vẫn có thể chọn thủ công nhưng dễ sai dữ liệu.",
        );
        try {
          const r2 = await axiosClient.get("/admin/players");
          setTeamRosterPlayers(
            (r2.data?.data || []).map((p) => ({
              PlayerID: p.PlayerID,
              Nickname: p.Nickname,
              Position: p.Position,
              Status: "UNKNOWN",
            })),
          );
        } catch {
          setTeamRosterPlayers([]);
        }
      })
      .finally(() => setLoadingPlayers(false));
  }, [seasonId, form.fromTeamId]);
  useEffect(() => {
    fetchTeamRosterPlayers();
  }, [fetchTeamRosterPlayers]);

  // ── BƯỚC 3: Khi chọn player → fetch context (đội hiện tại, stats) ─
  const fetchPlayerContext = useCallback(() => {
    if (!form.playerId || !seasonId) {
      setPlayerCtx(null);
      return;
    }
    setLoadingCtx(true);
    axiosClient
      .get(`/admin/rosters/player/${form.playerId}`, { params: { seasonId } })
      .then((r) => {
        const row = r.data?.data || null;
        setPlayerCtx(row);
        // Chỉ auto-fill fromTeamId nếu user chưa chọn đội nguồn
        setForm((f) => ({
          ...f,
          fromTeamId: f.fromTeamId || row?.TeamID || "",
        }));
      })
      .catch(() => setPlayerCtx(null))
      .finally(() => setLoadingCtx(false));
  }, [form.playerId, seasonId]);

  // Gọi context khi playerId thay đổi — dùng useEffect độc lập
  useEffect(() => {
    fetchPlayerContext();
  }, [form.playerId, seasonId]); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "fromTeamId"
        ? { toTeamId: "", playerId: "" }
        : name === "playerId"
          ? {}
          : null),
    }));
    if (name === "playerId") setPlayerCtx(null);
  };

  const handleSubmit = async () => {
    setResult(null);
    setLoading(true);
    try {
      const res = await axiosClient.post("/admin/transfers", {
        playerId: form.playerId,
        fromTeamId: form.fromTeamId,
        toTeamId: form.toTeamId,
        seasonId,
        transferFee: form.transferFee ? parseFloat(form.transferFee) : 0,
        reason: form.reason || null,
        approvedBy: form.approvedBy || null,
      });
      setResult({
        type: "COMMIT",
        message: res.data.message,
        data: res.data.data,
      });
      setForm({
        playerId: "",
        fromTeamId: "",
        toTeamId: "",
        transferFee: "",
        reason: "",
        approvedBy: "",
      });
      setPlayerCtx(null);
    } catch (err) {
      const data = err.response?.data;
      setResult({
        type: "ROLLBACK",
        message:
          data?.message || "Chuyển nhượng thất bại. Transaction ROLLBACK.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSeason = seasons.find((s) => s.SeasonID === seasonId);
  // Đội đích = đội trong mùa, trừ đội nguồn
  const toTeams = seasonTeams.filter((t) => t.TeamID !== form.fromTeamId);

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase mb-1">
          🔄 Chuyển Nhượng Tuyển Thủ
        </h1>
        <p className="text-sm font-bold text-orange-500/80 mb-8 uppercase tracking-widest bg-orange-500/10 inline-block px-3 py-1 rounded border border-orange-500/20">
          ATOMIC TRANSACTION · BẮT BUỘC TOÀN VẸN DỮ LIỆU
        </p>

        {loadError && (
          <div className="mb-6 p-4 border rounded-xl text-sm font-medium bg-amber-900/10 border-amber-500/20 text-amber-300">
            ⚠️ {loadError}
          </div>
        )}

        {/* ── Kết quả transaction ── */}
        {result && (
          <div
            className={`mb-8 p-6 rounded-2xl border-2 ${result.type === "COMMIT" ? "bg-emerald-900/20 border-emerald-500/50" : "bg-red-900/20 border-red-500/50"}`}
          >
            <h3
              className={`text-xl font-black uppercase tracking-wider mb-2 ${result.type === "COMMIT" ? "text-emerald-400" : "text-red-400"}`}
            >
              {result.type === "COMMIT"
                ? "✅ Transaction COMMIT"
                : "❌ Transaction ROLLBACK"}
            </h3>
            <p className="text-slate-300 text-sm mb-4">{result.message}</p>
            {result.type === "COMMIT" && result.data && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20">
                <div>
                  <p className="text-emerald-500 text-xs font-bold uppercase">
                    Tuyển thủ
                  </p>
                  <p className="font-bold text-slate-200">
                    {result.data.TuyenThu}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-500 text-xs font-bold uppercase">
                    Rời đội
                  </p>
                  <p className="font-bold text-slate-400">
                    {result.data.DoiCu}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-500 text-xs font-bold uppercase">
                    Vào đội
                  </p>
                  <p className="font-bold text-slate-200">
                    {result.data.DoiMoi}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-500 text-xs font-bold uppercase">
                    Phí
                  </p>
                  <p className="font-bold text-amber-400">
                    {Number(result.data.PhiChuyenNhuong || 0).toLocaleString()}{" "}
                    đ
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-6">
          {/* ── Mùa giải (smart default) ── */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bước 1 — Mùa giải
            </label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              required
              className={sel.replace("orange", "orange")}
            >
              <option value="">-- Chọn mùa --</option>
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>
                  {s.SeasonName} [{s.Status}]
                </option>
              ))}
            </select>
          </div>

          {/* ── Tuyển thủ (lọc theo mùa) ── */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bước 2 — Đội nguồn (rời đội)
              {seasonId && !loadingTeams && (
                <span className="ml-2 text-orange-400 normal-case font-normal">
                  ({seasonTeams.length} đội trong {selectedSeason?.SeasonName})
                </span>
              )}
            </label>
            <select
              name="fromTeamId"
              value={form.fromTeamId}
              onChange={handleChange}
              required
              disabled={!seasonId || loadingTeams}
              className={sel}
            >
              <option value="">
                {loadingTeams
                  ? "Đang tải đội..."
                  : seasonId
                    ? "-- Chọn đội nguồn --"
                    : "← Chọn mùa trước"}
              </option>
              {seasonTeams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName}
                </option>
              ))}
            </select>
          </div>

          {/* ── Bước 3: Tuyển thủ thuộc đội nguồn ── */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bước 3 — Tuyển thủ (trong roster ACTIVE của đội nguồn)
              {form.fromTeamId && !loadingPlayers && (
                <span className="ml-2 text-orange-400 normal-case font-normal">
                  ({teamRosterPlayers.length} người)
                </span>
              )}
            </label>
            <select
              name="playerId"
              value={form.playerId}
              onChange={handleChange}
              required
              disabled={!seasonId || !form.fromTeamId || loadingPlayers}
              className={sel}
              style={{
                color: form.playerId ? "#fb923c" : undefined,
                fontWeight: form.playerId ? 700 : undefined,
              }}
            >
              <option value="">
                {loadingPlayers
                  ? "Đang tải roster..."
                  : form.fromTeamId
                    ? "-- Chọn tuyển thủ --"
                    : "← Chọn đội nguồn trước"}
              </option>
              {teamRosterPlayers.map((p) => (
                <option key={p.PlayerID} value={p.PlayerID}>
                  {p.Nickname} ({p.PlayerID}) — {p.Position}
                </option>
              ))}
            </select>

            {/* Context panel — hiện khi đã chọn player */}
            {loadingCtx && (
              <div className="mt-2 px-4 py-2 bg-slate-800/60 rounded-lg text-xs text-slate-500">
                Đang tải thông tin tuyển thủ...
              </div>
            )}
            {!loadingCtx && form.playerId && playerCtx && (
              <div className="mt-2 flex items-center gap-4 px-4 py-3 bg-orange-900/10 border border-orange-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xs flex-shrink-0">
                  {(playerCtx.Nickname || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-white">
                    {playerCtx.Nickname}
                  </span>
                  <span className="mx-2 text-slate-500">·</span>
                  <span className="text-orange-400 font-semibold">
                    {playerCtx.Position}
                  </span>
                  <span className="mx-2 text-slate-500">·</span>
                  <span className="text-slate-400">Đang ở</span>
                  <span className="ml-1 font-bold text-white">
                    {playerCtx.TeamName || form.fromTeamId}
                  </span>
                </div>
                {playerCtx.AvgKDA != null && (
                  <div className="ml-auto text-right text-xs">
                    <span className="text-cyan-400 font-bold">
                      {Number(playerCtx.AvgKDA).toFixed(2)}
                    </span>
                    <span className="text-slate-600 ml-1">KDA</span>
                  </div>
                )}
              </div>
            )}
            {!loadingCtx && form.playerId && !playerCtx && (
              <div className="mt-2 px-4 py-2 bg-amber-900/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                ⚠️ Không lấy được context roster của tuyển thủ theo mùa — vui
                lòng kiểm tra API hoặc thử reload backend.
              </div>
            )}
          </div>

          {/* ── Từ đội → Đến đội ── */}
          <div className="grid sm:grid-cols-2 gap-6 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0b1120] font-black z-10 text-lg">
              ➝
            </div>

            {/* Rời đội — đã chọn từ bước 2 */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Rời đội (Từ) — đội nguồn
              </label>
              <select
                name="fromTeamId"
                value={form.fromTeamId}
                onChange={handleChange}
                required
                disabled={!seasonId || loadingTeams}
                className={sel}
              >
                <option value="">
                  {loadingTeams
                    ? "Đang tải..."
                    : seasonId
                      ? "-- Chọn đội nguồn --"
                      : "← Chọn mùa"}
                </option>
                {seasonTeams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName}
                  </option>
                ))}
              </select>
            </div>

            {/* Vào đội — loại trừ đội nguồn */}
            <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20">
              <label className="block text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                Vào đội (Đến)
                {form.fromTeamId && (
                  <span className="ml-2 text-slate-500 normal-case font-normal">
                    ({toTeams.length} đội khả dụng)
                  </span>
                )}
              </label>
              <select
                name="toTeamId"
                value={form.toTeamId}
                onChange={handleChange}
                required
                disabled={!form.fromTeamId || !form.playerId}
                className={sel}
              >
                <option value="">
                  {form.fromTeamId && form.playerId
                    ? "-- Chọn đội mới --"
                    : "← Chọn đội nguồn + tuyển thủ trước"}
                </option>
                {toTeams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Thông tin bổ sung ── */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Phí chuyển nhượng (VND)
              </label>
              <input
                type="number"
                name="transferFee"
                value={form.transferFee}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-slate-950/80 border border-slate-700 text-amber-400 font-bold rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Lý do
              </label>
              <input
                type="text"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="VD: Hợp đồng hết hạn"
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Người duyệt
              </label>
              <input
                type="text"
                name="approvedBy"
                value={form.approvedBy}
                onChange={handleChange}
                placeholder="Admin League"
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !form.playerId ||
              !form.fromTeamId ||
              !form.toTeamId ||
              !seasonId
            }
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg py-4 text-sm font-black tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
          >
            {loading
              ? "⏳ Đang xử lý transaction..."
              : "THỰC THI CHUYỂN NHƯỢNG"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferForm;
