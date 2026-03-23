// src/pages/admin/TransferForm.jsx - (THÚY VI)
// POST /api/transfers → sp_TransferPlayer
// Body: { playerId, fromTeamId, toTeamId, seasonId, transferFee?, reason?, approvedBy? }
// SP response row: { TuyenThu, DoiCu, DoiMoi, MuaGiai, PhiChuyenNhuong, ThoiGian, TrangThai }
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const TransferForm = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [form, setForm] = useState({
    playerId: "",
    fromTeamId: "",
    toTeamId: "",
    seasonId: "",
    transferFee: "",
    reason: "",
    approvedBy: "",
  });
  const [result, setResult] = useState(null); // { type: 'COMMIT'|'ROLLBACK', message, data }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/players")
      .then((r) => setPlayers(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const res = await axiosClient.post("/transfers", {
        playerId: form.playerId,
        fromTeamId: form.fromTeamId,
        toTeamId: form.toTeamId,
        seasonId: form.seasonId,
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
        seasonId: "",
        transferFee: "",
        reason: "",
        approvedBy: "",
      });
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

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">
        Chuyển nhượng tuyển thủ
      </h1>
      <p className="text-xs text-gray-400 mb-1">
        SP: <code className="bg-gray-100 px-1 rounded">sp_TransferPlayer</code>{" "}
        — REPEATABLE READ + UPDLOCK + HOLDLOCK
      </p>
      <p className="text-xs text-gray-400 mb-5">
        7 bước Atomic: validate → check đội cũ → check slot → check đội mới đăng
        ký mùa → TRANSFERRED_OUT → INSERT roster mới → log →{" "}
        <strong>COMMIT</strong>
      </p>

      {/* Banner kết quả Transaction */}
      {result && (
        <div
          className={`mb-5 p-4 rounded-xl border-2 ${
            result.type === "COMMIT"
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-red-50 border-red-400 text-red-800"
          }`}
        >
          <div className="font-semibold text-base mb-1">
            {result.type === "COMMIT"
              ? "✅ Transaction COMMIT"
              : "❌ Transaction ROLLBACK"}
          </div>
          <div className="text-sm">{result.message}</div>

          {/* Chi tiết khi thành công — data từ SP */}
          {result.type === "COMMIT" && result.data && (
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs bg-green-100 rounded-lg p-3">
              <span className="text-green-700">Tuyển thủ:</span>
              <span className="font-medium">{result.data.TuyenThu}</span>
              <span className="text-green-700">Rời đội:</span>
              <span>{result.data.DoiCu}</span>
              <span className="text-green-700">Vào đội:</span>
              <span className="font-medium">{result.data.DoiMoi}</span>
              <span className="text-green-700">Phí:</span>
              <span>
                {Number(result.data.PhiChuyenNhuong || 0).toLocaleString(
                  "vi-VN",
                )}{" "}
                đ
              </span>
            </div>
          )}

          {result.type === "ROLLBACK" && (
            <div className="mt-2 text-xs text-red-600">
              Không có thay đổi nào được lưu vào database.
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Tuyển thủ cần chuyển
          </label>
          <select
            name="playerId"
            value={form.playerId}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">-- Chọn tuyển thủ --</option>
            {players.map((p) => (
              <option key={p.PlayerID} value={p.PlayerID}>
                {p.Nickname} ({p.PlayerID}) — {p.Position}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Rời đội (FromTeam)
            </label>
            <select
              name="fromTeamId"
              value={form.fromTeamId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">-- Đội cũ --</option>
              {teams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Vào đội (ToTeam)
            </label>
            <select
              name="toTeamId"
              value={form.toTeamId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">-- Đội mới --</option>
              {teams.map((t) => (
                <option key={t.TeamID} value={t.TeamID}>
                  {t.TeamName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Mùa giải</label>
          <select
            name="seasonId"
            value={form.seasonId}
            onChange={handleChange}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Phí chuyển nhượng (đ)
            </label>
            <input
              type="number"
              name="transferFee"
              value={form.transferFee}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Người duyệt
            </label>
            <input
              type="text"
              name="approvedBy"
              value={form.approvedBy}
              onChange={handleChange}
              placeholder="Admin League"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Lý do</label>
          <input
            type="text"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Theo nguyện vọng cầu thủ"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors mt-1"
        >
          {loading
            ? "⏳ Đang xử lý transaction..."
            : "🔄 Thực hiện chuyển nhượng"}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;
