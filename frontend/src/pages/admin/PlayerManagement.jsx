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
const POS_REQ = ["Top", "Jungle", "Mid", "ADC", "Support"];
const sel = "ui-select";
const inp =
  "w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors";

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-100">{title}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 font-black text-lg"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ErrBox = ({ msg }) =>
  msg ? (
    <div className="mb-4 p-3 rounded-xl border bg-red-900/20 border-red-500/30 text-red-300 text-sm font-medium">
      {msg}
    </div>
  ) : null;

const PlayerManagement = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [seasonTeams, setSeasonTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [flash, setFlash] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [createForm, setCreateForm] = useState({
    playerId: "",
    nickname: "",
    fullName: "",
    position: "Top",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    playerId: "",
    nickname: "",
    fullName: "",
    position: "Top",
  });

  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState("");

  const showFlash = (type, text) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 5000);
  };

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

  useEffect(() => {
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

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        p.Nickname?.toLowerCase().includes(q) ||
        p.PlayerID?.toLowerCase().includes(q)) &&
      (!posFilter || p.Position === posFilter)
    );
  });

  const toggleStatus = async (playerId, isActive) => {
    setTogglingId(playerId);
    try {
      await axiosClient.patch(
        `/admin/players/${playerId}/${isActive ? "deactivate" : "activate"}`,
      );
      setPlayers((prev) =>
        prev.map((p) =>
          p.PlayerID === playerId ? { ...p, IsActive: isActive ? 0 : 1 } : p,
        ),
      );
      showFlash(
        "success",
        isActive
          ? `Đã ẩn tuyển thủ ${playerId}.`
          : `Đã kích hoạt lại ${playerId}.`,
      );
    } catch (err) {
      showFlash(
        "error",
        err.response?.data?.message || "Lỗi khi cập nhật trạng thái.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const openCreate = async () => {
    setCreateErr("");
    setCreateOpen(true);
    setCreating(false);
    setCreateForm({
      playerId: "",
      nickname: "",
      fullName: "",
      position: "Top",
    });
    try {
      const r = await axiosClient.get("/admin/players/next-id");
      setCreateForm((f) => ({ ...f, playerId: r.data?.nextId || "" }));
    } catch {}
  };

  const submitCreate = async () => {
    setCreateErr("");
    setCreating(true);
    try {
      const r = await axiosClient.post("/admin/players", {
        playerId: createForm.playerId?.trim() || undefined,
        nickname: createForm.nickname?.trim(),
        fullName: createForm.fullName?.trim() || null,
        position: createForm.position,
      });
      const newP = r.data?.data;
      if (newP) setPlayers((prev) => [newP, ...prev]);
      showFlash("success", r.data?.message || "Đã tạo tuyển thủ.");
      setCreateOpen(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || "Không thể tạo tuyển thủ.");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (p) => {
    setEditErr("");
    setEditForm({
      playerId: p.PlayerID,
      nickname: p.Nickname,
      fullName: p.FullName || "",
      position: p.Position,
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    setEditErr("");
    setEditing(true);
    try {
      const r = await axiosClient.put(`/admin/players/${editForm.playerId}`, {
        nickname: editForm.nickname.trim(),
        fullName: editForm.fullName.trim() || null,
        position: editForm.position,
      });
      const upd = r.data?.data;
      setPlayers((prev) =>
        prev.map((p) =>
          p.PlayerID === editForm.playerId
            ? {
                ...p,
                Nickname: upd.Nickname,
                FullName: upd.FullName,
                Position: upd.Position,
              }
            : p,
        ),
      );
      showFlash("success", `Đã cập nhật thông tin ${editForm.playerId}.`);
      setEditOpen(false);
    } catch (err) {
      setEditErr(err.response?.data?.message || "Lỗi khi cập nhật.");
    } finally {
      setEditing(false);
    }
  };

  const submitDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    setDelErr("");
    try {
      await axiosClient.delete(`/admin/players/${delTarget.PlayerID}`);
      setPlayers((prev) =>
        prev.filter((p) => p.PlayerID !== delTarget.PlayerID),
      );
      showFlash(
        "success",
        `Đã xóa tuyển thủ ${delTarget.Nickname} (${delTarget.PlayerID}).`,
      );
      setDelTarget(null);
    } catch (err) {
      setDelErr(err.response?.data?.message || "Lỗi khi xóa tuyển thủ.");
    } finally {
      setDeleting(false);
    }
  };

  const selectedSeason = seasons.find((s) => s.SeasonID === seasonId);

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-1">
          Quản Lý Tuyển Thủ
        </h1>

        {flash && (
          <div
            className={`mb-5 p-4 rounded-xl border font-medium text-sm ${
              flash.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {flash.text}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex flex-col gap-1 justify-end">
              <span className="text-xs opacity-0 select-none">.</span>
              <button
                onClick={openCreate}
                className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white rounded-lg border border-red-500/30 bg-gradient-to-r from-red-600/60 to-orange-600/60 hover:from-red-600 hover:to-orange-600 transition-all"
              >
                + Thêm tuyển thủ
              </button>
            </div>
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
                      : "Chọn mùa trước"}
                </option>
                {seasonTeams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName} ({t.ShortName})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Vị trí
              </span>
              <select
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
                className={sel}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p || "Tất cả vị trí"}
                  </option>
                ))}
              </select>
            </div>
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
            {(search || posFilter || teamId) && (
              <div className="flex flex-col gap-1 justify-end">
                <span className="text-xs opacity-0 select-none">.</span>
                <button
                  onClick={() => {
                    setSearch("");
                    setPosFilter("");
                    setTeamId("");
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors"
                >
                  ✕ Xóa lọc
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-4 text-xs font-bold">
            <span className="text-slate-500">
              Hiển thị <span className="text-white">{filtered.length}</span>{" "}
              tuyển thủ
            </span>
            <span className="text-emerald-400">
              {filtered.filter((p) => p.IsActive !== 0).length} hoạt động
            </span>
            <span className="text-red-400">
              {filtered.filter((p) => p.IsActive === 0).length} bị ẩn
            </span>
          </div>

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
                      className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
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
                      className="text-center py-12 text-slate-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-500"
                    >
                      Không tìm thấy tuyển thủ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isActive = p.IsActive !== 0;
                    const isToggling = togglingId === p.PlayerID;
                    return (
                      <tr
                        key={p.PlayerID}
                        className={`hover:bg-slate-800/40 transition-colors ${!isActive ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-sm font-bold text-slate-400">
                          {p.PlayerID}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">
                          {p.Nickname}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {p.FullName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${POSITION_COLOR[p.Position] || "bg-slate-700/50 text-slate-300 border-slate-600"}`}
                          >
                            {p.Position}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isActive ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              Bị ẩn
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors whitespace-nowrap"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => toggleStatus(p.PlayerID, isActive)}
                              disabled={isToggling}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                isActive
                                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              }`}
                            >
                              {isToggling ? "..." : isActive ? "Ẩn" : "Hiện"}
                            </button>
                            <button
                              onClick={() => {
                                setDelErr("");
                                setDelTarget(p);
                              }}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {createOpen && (
          <Modal
            title="Thêm tuyển thủ mới"
            onClose={() => setCreateOpen(false)}
          >
            <ErrBox msg={createErr} />
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
                  className={inp + " font-mono"}
                />
                <p className="text-xs mt-1 text-slate-500">
                  Bỏ trống để hệ thống tự sinh theo P###.
                </p>
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
                  className={inp}
                >
                  {POS_REQ.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nickname * (không trùng)
                </label>
                <input
                  value={createForm.nickname}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, nickname: e.target.value }))
                  }
                  placeholder="VD: Levi"
                  className={inp}
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
                  className={inp}
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
          </Modal>
        )}

        {editOpen && (
          <Modal
            title={`Chỉnh sửa — ${editForm.playerId}`}
            onClose={() => setEditOpen(false)}
          >
            <ErrBox msg={editErr} />
            <div className="mb-4 p-3 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-400 text-xs">
              PlayerID{" "}
              <span className="font-mono text-slate-300">
                {editForm.playerId}
              </span>{" "}
              không thể thay đổi (khóa chính).
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nickname * (không trùng)
                </label>
                <input
                  value={editForm.nickname}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, nickname: e.target.value }))
                  }
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Vị trí
                </label>
                <select
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, position: e.target.value }))
                  }
                  className={inp}
                >
                  {POS_REQ.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Tên đầy đủ
                </label>
                <input
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="(không bắt buộc)"
                  className={inp}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-3 text-sm font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={submitEdit}
                disabled={editing || !editForm.nickname.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg py-3 text-sm font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
              >
                {editing ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </Modal>
        )}

        {delTarget && (
          <Modal
            title="Xác nhận xóa tuyển thủ"
            onClose={() => setDelTarget(null)}
          >
            <ErrBox msg={delErr} />
            <div className="mb-6 p-4 rounded-xl border bg-red-900/10 border-red-500/20">
              <p className="text-slate-200 text-sm font-medium mb-1">
                Bạn đang xóa vĩnh viễn:
              </p>
              <p className="text-red-400 font-black text-lg">
                {delTarget.Nickname}{" "}
                <span className="font-mono text-sm text-red-300">
                  ({delTarget.PlayerID})
                </span>
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Hành động này không thể hoàn tác. Tuyển thủ đang có roster hoặc
                lịch sử chuyển nhượng sẽ bị chặn tự động.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDelTarget(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-3 text-sm font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={submitDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-3 text-sm font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
              >
                {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default PlayerManagement;
