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
    // Call API thật:
    axiosClient
      .get("/admin/players")
      .then((r) => setPlayers(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/admin/seasons")
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
      // Call API thật
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
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase mb-2">
          🔄 Chuyển Nhượng Tuyển Thủ
        </h1>
        <p className="text-sm font-bold text-orange-500/80 mb-8 uppercase tracking-widest bg-orange-500/10 inline-block px-3 py-1 rounded border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
          ATOMIC TRANSACTION: BẮT BUỘC TOÀN VẸN DỮ LIỆU
        </p>

        {result && (
          <div
            className={`mb-8 p-6 rounded-2xl border-2 backdrop-blur-md shadow-2xl ${result.type === "COMMIT" ? "bg-emerald-900/20 border-emerald-500/50 shadow-emerald-500/20" : "bg-red-900/20 border-red-500/50 shadow-red-500/20"}`}
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

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-6"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Tuyển thủ giao dịch
            </label>
            <select
              name="playerId"
              value={form.playerId}
              onChange={handleChange}
              required
              className="w-full bg-slate-950/80 border border-slate-700 text-orange-400 font-bold rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">-- Chọn --</option>
              {players.map((p) => (
                <option key={p.PlayerID} value={p.PlayerID}>
                  {p.Nickname} ({p.PlayerID}) — {p.Position}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 font-black italic z-10">
              ➝
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Rời đội (Từ)
              </label>
              <select
                name="fromTeamId"
                value={form.fromTeamId}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-400 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500"
              >
                <option value="">-- Đội cũ --</option>
                {teams.map((t) => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20">
              <label className="block text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                Vào đội (Đến)
              </label>
              <select
                name="toTeamId"
                value={form.toTeamId}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-orange-700/50 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
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

          <div className="grid sm:grid-cols-3 gap-6 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Mùa giải
              </label>
              <select
                name="seasonId"
                value={form.seasonId}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">-- Chọn --</option>
                {seasons.map((s) => (
                  <option key={s.SeasonID} value={s.SeasonID}>
                    {s.SeasonName}
                  </option>
                ))}
              </select>
            </div>
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
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg py-4 text-sm font-black tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50 transition-all transform hover:scale-[1.01] mt-4"
          >
            {loading
              ? "⏳ Đang khóa bảng & xử lý..."
              : "THỰC THI CHUYỂN NHƯỢNG"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;
