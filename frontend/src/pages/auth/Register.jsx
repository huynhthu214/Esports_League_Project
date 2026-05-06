import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const Register = () => {
  const [form, setForm] = useState({ username: "", password: "", role: "FAN" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await axiosClient.post("/auth/register", form);
      setSuccess("Tạo tài khoản thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Tên tài khoản có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120] relative overflow-hidden font-sans">
      {/* Hiệu ứng Background Glow (Neon) */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Box Form */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-[0_0_40px_rgba(8,_112,_184,_0.1)] z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase">
            Gia Nhập Đấu Trường
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Tạo tài khoản để theo dõi đội tuyển yêu thích</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
              placeholder="Nhập tên tài khoản..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
              placeholder="Ít nhất 6 ký tự"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Vai trò (Role)</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
            >
              <option value="FAN" className="bg-slate-900 text-slate-200">FAN - Người hâm mộ</option>
              <option value="ANALYST" className="bg-slate-900 text-slate-200">ANALYST - Chuyên viên phân tích</option>
              <option value="ADMIN" className="bg-slate-900 text-red-400 font-semibold">ADMIN - Ban tổ chức</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg py-3 text-sm font-bold tracking-wide uppercase shadow-lg shadow-purple-900/50 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Đang xử lý..." : "Đăng Ký"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;