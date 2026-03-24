import { useState, useEffect } from "react";
// LƯU Ý: Khi dán vào source code thật của dự án, hãy xóa biến axiosClient mock này đi 
// và mở lại dòng import: import axiosClient from "../../api/axiosClient";
const axiosClient = {
  post: () => new Promise((resolve) => setTimeout(() => resolve({ data: { message: "Đã thiết lập mùa giải mới!" } }), 800))
};

const SeasonForm = () => {
  const [form, setForm] = useState({ seasonId: "", seasonName: "", startDate: "", endDate: "", maxTeams: 12, format: "BO3" });
  const [loading, setLoading] = useState(false);
  
  // State quản lý Toast Notification
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  // Hàm gọi Toast tự động ẩn sau 4 giây
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ show: false, type: "", message: "" });

    // XỬ LÝ KIỂM TRA NGÀY THÁNG (VALIDATION)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (startDate <= today) {
      showToast("error", "Ngày bắt đầu phải từ ngày mai trở đi.");
      return;
    }

    if (endDate <= startDate) {
      showToast("error", "Ngày kết thúc phải diễn ra sau ngày bắt đầu.");
      return;
    }

    const MAX_SEASON_DAYS = 180;
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > MAX_SEASON_DAYS) {
      showToast("error", `Mùa giải quá dài. Tối đa cho phép là ${MAX_SEASON_DAYS} ngày (Bạn chọn ${diffDays} ngày).`);
      return;
    }

    setLoading(true);
    try {
      // Gọi API
      const res = await axiosClient.post("/seasons", {
        seasonId: form.seasonId.trim().toUpperCase(),
        seasonName: form.seasonName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        maxTeams: parseInt(form.maxTeams),
        format: form.format,
      });
      
      showToast("success", res.data.message || `Đã thiết lập thành công ${form.seasonName}!`);
      setForm({ seasonId: "", seasonName: "", startDate: "", endDate: "", maxTeams: 12, format: "BO3" });
    } catch (err) {
      showToast("error", `Lỗi server: ${err.response?.data?.message || "Không thể tạo mùa giải."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full min-h-[calc(100vh-70px)] bg-[#0b1120] text-slate-200 p-8 font-sans relative">
      
      {/* TOAST NOTIFICATION GỌN NHẸ HƠN */}
      <div 
        className={`fixed top-6 right-6 z-50 min-w-[300px] max-w-sm backdrop-blur-xl bg-slate-900/90 rounded-lg p-4 shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 ${
          toast.show ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
        } ${
          toast.type === "success" 
            ? "border-emerald-500 shadow-[0_5px_20px_rgba(16,185,129,0.2)] text-emerald-400" 
            : "border-red-500 shadow-[0_5px_20px_rgba(239,68,68,0.2)] text-red-400"
        }`}
      >
        <div className="text-xl">
          {toast.type === "success" ? "✅" : "⚠️"}
        </div>
        <div className="flex-1 text-sm font-medium text-slate-200 leading-tight">
          {toast.message}
        </div>
        <button 
          onClick={() => setToast({ ...toast, show: false })}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
        >
          ✕
        </button>
      </div>
      {/* END TOAST */}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase mb-2">
          📅 Tạo Mùa Giải
        </h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">Khởi tạo dữ liệu giải đấu mới vào cơ sở dữ liệu. (Giới hạn tối đa 180 ngày/mùa)</p>

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Season ID *</label>
              <input name="seasonId" value={form.seasonId} onChange={handleChange} required maxLength={10} className="w-full bg-slate-950/80 border border-slate-700 text-emerald-400 font-mono uppercase rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" placeholder="SS2026_1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Format</label>
              <select name="format" value={form.format} onChange={handleChange} className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500">
                <option value="BO1">BO1 (Best of 1)</option><option value="BO3">BO3 (Best of 3)</option><option value="BO5">BO5 (Best of 5)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tên mùa giải *</label>
            <input name="seasonName" value={form.seasonName} onChange={handleChange} required className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" placeholder="Nexus Championship 2026" />
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bắt đầu</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kết thúc</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Số đội</label>
              <input type="number" name="maxTeams" value={form.maxTeams} onChange={handleChange} min={4} max={32} className="w-full bg-slate-950/80 border border-slate-700 text-amber-400 font-bold rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          {form.seasonId && form.seasonName && (
            <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 text-sm text-cyan-300 flex items-center gap-3 transition-all">
              <span className="text-2xl">👀</span> 
              <div>
                <strong>Preview:</strong> [{form.seasonId.toUpperCase()}] {form.seasonName} <br/>
                <span className="text-xs text-cyan-500">{form.startDate || "..."} ➝ {form.endDate || "..."}</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all mt-2">
            {loading ? "Đang khởi tạo..." : "Khai Mạc Giải Đấu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeasonForm;