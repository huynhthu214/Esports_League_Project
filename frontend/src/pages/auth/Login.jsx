import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import axiosClient from "../../api/axiosClient";

// ─── Particle Canvas ────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const N = 80;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? "0,212,255" : "168,85,247",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,212,255,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// ─── Floating Orbs ──────────────────────────────────────────────
const FloatingOrbs = () => (
  <>
    <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '4s' }} />
    <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
    <div className="fixed top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
  </>
);

// ─── Main Login ──────────────────────────────────────────────────
const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", form);
      login(res.data.token, res.data.user);
      const role = res.data.user.role;
      if (role === "ADMIN") navigate("/admin");
      else if (["ANALYST", "COACH"].includes(role)) navigate("/analyst");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050c18] relative overflow-hidden font-sans">
      {/* Animated background */}
      <ParticleCanvas />
      <FloatingOrbs />

      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }} />

      {/* Form card */}
      <div className={`relative z-10 w-full max-w-md px-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Logo section */}
        <div className="text-center mb-8">
          {/* Animated logo icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 mb-5 shadow-[0_0_40px_rgba(0,212,255,0.2)] relative">
            <span className="text-4xl">⚡</span>
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 border border-cyan-400"></div>
          </div>
          <h1 className="text-4xl font-black italic tracking-wider uppercase mb-1"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #00d4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'shimmer 3s ease infinite' }}>
            Nexus Esports
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Hệ Thống Quản Lý Giải Đấu</p>

          {/* Decorative line */}
          <div className="flex items-center gap-3 mt-4 justify-center">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]"></div>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-purple-500/50"></div>
          </div>
        </div>

        {/* Glass card */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]">
          
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm text-center font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tên đăng nhập</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  id="login-username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 text-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 hover:border-slate-600"
                  placeholder="Nhập tên tài khoản..."
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 text-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 hover:border-slate-600"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="relative w-full mt-2 py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-white overflow-hidden disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #06b6d4 100%)', boxShadow: '0 0 30px rgba(0,212,255,0.3), 0 4px 20px rgba(0,0,0,0.4)' }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang kết nối...</>
                ) : (
                  <><span>⚡</span> Đăng Nhập</>
                )}
              </span>
              {/* Shimmer */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Role hints */}
        <div className="mt-5 flex gap-2 justify-center flex-wrap">
          {[
            { icon: '⚡', label: 'Admin', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
            { icon: '📊', label: 'Analyst', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
            { icon: '🏠', label: 'Fan', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' },
          ].map(r => (
            <span key={r.label} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${r.color}`}>
              {r.icon} {r.label}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes animate-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: animate-shake 0.3s ease; }
      `}</style>
    </div>
  );
};

export default Login;