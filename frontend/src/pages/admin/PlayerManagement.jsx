import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";

const POSITION_COLOR = {
  Top: "bg-red-500/20 text-red-400 border-red-500/30",
  Jungle: "bg-green-500/20 text-green-400 border-green-500/30",
  Mid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ADC: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Support: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const POSITIONS = ["", "Top", "Jungle", "Mid", "ADC", "Support"];
const sel = "ui-select";

const PlayerManagement = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [seasonTeams, setSeasonTeams] = useState([]);
  const [teamId, setTeamId] = useState(""); // '' = tất cả đội
  const [positionFilter, setPositionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [status, setStatus] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [createForm, setCreateForm] = useState({
    playerId: "",
    nickname: "",
    fullName: "",
    position: "Top",
  });

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

  // ── BƯỚC 2: Khi mùa đổi → load đội trong mùa ────────────────────
  const fetchSeasonTeams = useCallback(() => {
    if (!seasonId) {
      setSeasonTeams([]);
      setTeamId("");
      return;
    }
    setLoadingTeams(true);
    setTeamId("");
    axiosClient
      .get("/admin/season-teams", { params: { seasonId } })
      .then((r) => setSeasonTeams(r.data?.data || []))
      .catch(() => setSeasonTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [seasonId]);
  useEffect(() => {
    fetchSeasonTeams();
  }, [fetchSeasonTeams]);

  // ── BƯỚC 3: Load tất cả player (API trả IsActive cả 2 giá trị) ──
  const loadPlayers = useCallback(() => {
    setLoading(true);
    axiosClient
      .get("/admin/players/all")
      .then((r) => setPlayers(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // ── Filter tổng hợp: mùa → đội → vị trí → search ────────────────
  const filteredPlayers = players.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.Nickname?.toLowerCase().includes(q) ||
      p.PlayerID?.toLowerCase().includes(q);
    const matchPosition = !positionFilter || p.Position === positionFilter;
    return matchSearch && matchPosition;
  });

  // Thống kê
  const totalActive = filteredPlayers.filter((p) => p.IsActive !== 0).length;
  const totalInactive = filteredPlayers.filter((p) => p.IsActive === 0).length;

  const toggleStatus = async (playerId, isActive) => {
    setTogglingId(playerId);
    setStatus(null);
    try {
      const endpoint = isActive
        ? `/admin/players/${playerId}/deactivate`
        : `/admin/players/${playerId}/activate`;
      await axiosClient.patch(endpoint);
      setPlayers((prev) =>
        prev.map((p) =>
          p.PlayerID === playerId ? { ...p, IsActive: isActive ? 0 : 1 } : p,
        ),
      );
      setStatus({
        type: "success",
        text: isActive
          ? `✅ Đã ẩn tuyển thủ ${playerId}.`
          : `✅ Đã kích hoạt lại tuyển thủ ${playerId}.`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi cập nhật trạng thái.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const selectedSeason = seasons.find((s) => s.SeasonID === seasonId);

  const openCreate = async () => {
    setCreateErr("");
    setCreateOpen(true);
    setCreating(false);
    setCreateForm((f) => ({ ...f, nickname: "", fullName: "" }));
    try {
      const r = await axiosClient.get("/admin/players/next-id");
      setCreateForm((f) => ({ ...f, playerId: r.data?.nextId || "" }));
    } catch {
      // vẫn cho nhập thủ công nếu API lỗi
      setCreateForm((f) => ({ ...f, playerId: "" }));
    }
  };

  const submitCreate = async () => {
    setCreateErr("");
    setCreating(true);
    try {
      const body = {
        playerId: createForm.playerId?.trim() || undefined,
        nickname: createForm.nickname?.trim(),
        fullName: createForm.fullName?.trim() || null,
        position: createForm.position,
      };
      const r = await axiosClient.post("/admin/players", body);
      const newP = r.data?.data;
      if (newP) setPlayers((prev) => [newP, ...prev]);
      setStatus({
        type: "success",
        text: r.data?.message || "Đã tạo tuyển thủ.",
      });
      setCreateOpen(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || "Không tạo được tuyển thủ.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-1">
          ⚙️ Quản Lý Tuyển Thủ
        </h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">
          Ẩn/hiện tuyển thủ · Lọc theo mùa giải, đội, vị trí · Tìm kiếm nhanh
        </p>

        {status && (
          <div
            className={`mb-5 p-4 rounded-xl border font-medium text-sm ${
              status.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          {/* ── Bộ lọc 3 tầng ── */}
          <div className="flex flex-wrap gap-3 mb-5">
            {/* Create */}
            <div className="flex flex-col gap-1 justify-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest opacity-0 select-none">
                .
              </span>
              <button
                onClick={openCreate}
                className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white rounded-lg border border-red-500/30 bg-gradient-to-r from-red-600/60 to-orange-600/60 hover:from-red-600 hover:to-orange-600 transition-all"
              >
                ➕ Thêm tuyển thủ
              </button>
            </div>
            {/* Mùa giải */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Mùa giải
              </span>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className={sel}
              >
                <option value="">-- Tất cả mùa --</option>
                {seasons.map((s) => (
                  <option key={s.SeasonID} value={s.SeasonID}>
                    {s.SeasonName} [{s.Status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Đội (chỉ đội trong mùa) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Đội tuyển
                {seasonId && !loadingTeams && (
                  <span className="ml-1 text-red-400 normal-case font-normal">
                    ({seasonTeams.length} đội trong {selectedSeason?.SeasonName}
                    )
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
                      ? "Tất cả đội"
                      : "← Chọn mùa trước"}
                </option>
                {seasonTeams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName} ({t.ShortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Vị trí */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Vị trí
              </span>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className={sel}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p || "Tất cả vị trí"}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Tìm kiếm
              </span>
              <input
                type="text"
                placeholder="Nickname hoặc ID (VD: Levi, P001)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Reset filters */}
            {(search || positionFilter || teamId) && (
              <div className="flex flex-col gap-1 justify-end">
                <span className="text-xs opacity-0 select-none">.</span>
                <button
                  onClick={() => {
                    setSearch("");
                    setPositionFilter("");
                    setTeamId("");
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors"
                >
                  ✕ Xóa lọc
                </button>
              </div>
            )}
          </div>

          {/* ── Thống kê nhanh ── */}
          <div className="flex gap-4 mb-4 text-xs font-bold">
            <span className="text-slate-500">
              Hiển thị{" "}
              <span className="text-white">{filteredPlayers.length}</span> tuyển
              thủ
            </span>
            <span className="text-emerald-400">{totalActive} hoạt động</span>
            <span className="text-red-400">{totalInactive} bị ẩn</span>
          </div>

          {/* ── Bảng tuyển thủ ── */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800">
                <tr>
                  {[
                    "Mã TT",
                    "Nickname",
                    "Tên đầy đủ",
                    "Vị trí",
                    "Trạng thái",
                    "Hành động",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-500 text-sm"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-500 text-sm"
                    >
                      Không tìm thấy tuyển thủ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p) => {
                    const isActive = p.IsActive !== 0;
                    const isToggling = togglingId === p.PlayerID;
                    return (
                      <tr
                        key={p.PlayerID}
                        className={`hover:bg-slate-800/40 transition-colors ${!isActive ? "opacity-50" : ""}`}
                      >
                        <td className="px-5 py-4 font-mono text-sm font-bold text-slate-400">
                          {p.PlayerID}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-200">
                          {p.Nickname}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {p.FullName}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${POSITION_COLOR[p.Position] || "bg-slate-700/50 text-slate-300 border-slate-600"}`}
                          >
                            {p.Position}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isActive ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ● Hoạt động
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              ○ Bị ẩn
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleStatus(p.PlayerID, isActive)}
                            disabled={isToggling}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              isActive
                                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {isToggling ? "..." : isActive ? "Ẩn" : "Kích hoạt"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Create modal ── */}
        {createOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-100">
                  Thêm tuyển thủ mới
                </h3>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-200 font-black"
                >
                  ✕
                </button>
              </div>

              {createErr && (
                <div className="mb-4 p-3 rounded-xl border bg-red-900/20 border-red-500/30 text-red-300 text-sm font-medium">
                  {createErr}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    PlayerID (tự sinh)
                  </label>
                  <input
                    value={createForm.playerId}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, playerId: e.target.value }))
                    }
                    placeholder="VD: P123"
                    className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                  <div className="text-xs mt-1 text-slate-500">
                    Bỏ trống để hệ thống tự sinh theo P###.
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Vị trí
                  </label>
                  <select
                    value={createForm.position}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, position: e.target.value }))
                    }
                    className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  >
                    {POSITIONS.filter(Boolean).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Nickname (không trùng)
                  </label>
                  <input
                    value={createForm.nickname}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, nickname: e.target.value }))
                    }
                    placeholder="VD: Levi"
                    className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Tên đầy đủ
                  </label>
                  <input
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="(không bắt buộc)"
                    className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-3 text-sm font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={submitCreate}
                  disabled={creating || !createForm.nickname.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg py-3 text-sm font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
                >
                  {creating ? "Đang tạo..." : "Tạo tuyển thủ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerManagement;
