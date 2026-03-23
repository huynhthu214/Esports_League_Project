// src/pages/admin/SeasonForm.jsx - (THÚY VI)
// POST /api/seasons
// Body: { seasonId, seasonName, startDate, endDate, maxTeams?, format? }
import { useState } from "react";
import axiosClient from "../../api/axiosClient";

const SeasonForm = () => {
  const [form, setForm] = useState({
    seasonId: "",
    seasonName: "",
    startDate: "",
    endDate: "",
    maxTeams: 12,
    format: "BO3",
  });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Validate ngày
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setStatus({
        type: "error",
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post("/seasons", {
        seasonId: form.seasonId.trim().toUpperCase(),
        seasonName: form.seasonName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        maxTeams: parseInt(form.maxTeams),
        format: form.format,
      });
      setStatus({ type: "success", message: res.data.message });
      // Reset form
      setForm({
        seasonId: "",
        seasonName: "",
        startDate: "",
        endDate: "",
        maxTeams: 12,
        format: "BO3",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi server khi tạo mùa giải.";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">
        Tạo mùa giải mới
      </h1>
      <p className="text-xs text-gray-400 mb-5">
        Gắn với{" "}
        <code className="bg-gray-100 px-1 rounded">POST /api/seasons</code> —
        khởi tạo mùa giải và bảng xếp hạng
      </p>

      {status && (
        <div
          className={`mb-4 p-3 border rounded-lg text-sm ${
            status.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {status.type === "success" ? "✅ " : "❌ "}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Season ID <span className="text-red-400">*</span>
            </label>
            <input
              name="seasonId"
              value={form.seasonId}
              onChange={handleChange}
              placeholder="VD: SS2025_3"
              maxLength={10}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 uppercase"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tối đa 10 ký tự, không dấu
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Format</label>
            <select
              name="format"
              value={form.format}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="BO1">BO1</option>
              <option value="BO3">BO3</option>
              <option value="BO5">BO5</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Tên mùa giải <span className="text-red-400">*</span>
          </label>
          <input
            name="seasonName"
            value={form.seasonName}
            onChange={handleChange}
            placeholder="VD: Season Fall 2025"
            maxLength={100}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Ngày bắt đầu <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Ngày kết thúc <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Số đội tối đa
          </label>
          <input
            type="number"
            name="maxTeams"
            value={form.maxTeams}
            onChange={handleChange}
            min={4}
            max={32}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-400 mt-1">Từ 4 đến 32 đội</p>
        </div>

        {/* Preview */}
        {form.seasonId && form.seasonName && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <span className="font-medium">Preview:</span> [
            {form.seasonId.toUpperCase()}] {form.seasonName}
            {form.startDate && form.endDate && (
              <span className="text-blue-500">
                {" "}
                · {form.startDate} → {form.endDate}
              </span>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tạo mùa giải..." : "📅 Tạo mùa giải"}
        </button>
      </form>
    </div>
  );
};

export default SeasonForm;
