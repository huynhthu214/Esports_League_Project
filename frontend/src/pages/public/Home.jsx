import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";

// ─── Animated Counter ─────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = '', duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── Feature Card ─────────────────────────────────────────────────
const FeatureCard = ({ to, icon, title, desc, color, delay = 0 }) => (
  <Link
    to={to}
    className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 overflow-hidden transition-all duration-300 block transform hover:-translate-y-2"
    style={{ '--hover-color': color }}
  >
    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300`}
      style={{ boxShadow: `0 0 40px ${color}25, inset 0 0 40px ${color}05`, borderColor: color }}></div>
    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
      style={{ color }}></div>
    
    <div className="relative z-10">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300 drop-shadow-lg">{icon}</div>
      <div className="text-lg font-bold text-slate-100 mb-2 group-hover:transition-colors duration-200"
        style={{ color: 'inherit' }}>
        <span className="group-hover:text-transparent group-hover:bg-clip-text transition-all"
          style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
          {title}
        </span>
      </div>
      <div className="text-sm text-slate-400 leading-relaxed">{desc}</div>
    </div>

    <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-300 blur-xl -translate-x-4 translate-y-4"
      style={{ backgroundColor: color }}></div>
  </Link>
);

// ─── Main Home ────────────────────────────────────────────────────
const Home = () => {
  const { isLoggedIn, user } = useAuth();
  const [stats, setStats] = useState({ teams: 0, players: 0, matches: 0, seasons: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load quick stats
    Promise.all([
      axiosClient.get('/seasons').catch(() => ({ data: { data: [] } })),
      axiosClient.get('/teams').catch(() => ({ data: { data: [] } })),
      axiosClient.get('/players').catch(() => ({ data: { data: [] } })),
    ]).then(([sRes, tRes, pRes]) => {
      setStats({
        seasons: sRes.data.data?.length || 0,
        teams: tRes.data.data?.length || 0,
        players: pRes.data.data?.length || 0,
        matches: 0
      });
    });
  }, []);

  const publicFeatures = [
    { to: "/leaderboard/players", icon: "🏆", title: "Bảng Xếp Hạng KDA", desc: "Top tuyển thủ theo KDA, GPM và chỉ số toàn mùa. Lọc theo vị trí và mùa giải.", color: "#22d3ee" },
    { to: "/standings", icon: "📊", title: "Xếp Hạng Đội Tuyển", desc: "Bảng điểm, số thắng/thua và tỷ lệ chiến thắng của tất cả đội tuyển.", color: "#a855f7" },
    { to: "/schedule", icon: "📅", title: "Lịch Thi Đấu", desc: "Xem lịch thi đấu, danh sách đội tham gia và phong độ sơ bộ tuyển thủ.", color: "#f59e0b" },
    { to: "/matches", icon: "⚔️", title: "Lịch Sử Thi Đấu", desc: "Kết quả trận đấu, tỉ số và phong độ tuyển thủ trong từng trận.", color: "#ef4444" },
    { to: "/transfers", icon: "🔄", title: "Lịch Sử Chuyển Nhượng", desc: "Tra cứu lịch sử di chuyển của tuyển thủ giữa các đội.", color: "#10b981" },
    { to: "/leaderboard/players", icon: "🎯", title: "Thống Kê Tuyển Thủ", desc: "Phong độ chi tiết từng tuyển thủ yêu thích — KDA, gold, lịch sử trận.", color: "#8b5cf6" },
  ];

  const heroStats = [
    { label: "Đội Tuyển", value: stats.teams || 12, suffix: "+", icon: "🛡️", color: "#22d3ee" },
    { label: "Tuyển Thủ", value: stats.players || 60, suffix: "+", icon: "⚡", color: "#a855f7" },
    { label: "Mùa Giải", value: stats.seasons || 3, suffix: "", icon: "🏆", color: "#f59e0b" },
    { label: "Trận Đấu", value: stats.matches || 150, suffix: "+", icon: "⚔️", color: "#10b981" },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] relative overflow-hidden font-sans text-slate-200">

      {/* Animated background orbs */}
      <div className="absolute top-[-5%] left-[20%] w-[600px] h-[400px] bg-cyan-500/8 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '5s' }}></div>
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[350px] bg-blue-500/6 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }}></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      <div className={`relative z-10 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* ─── HERO SECTION ─── */}
        <div className="relative py-20 px-4 sm:px-6 lg:px-8 text-center">
          {/* Glowing title line */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Live System — Dual-Write MongoDB & SQL Server
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 40%, #a855f7 60%, #22d3ee 100%)', backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite' }}>
              Nexus
            </span>
            <span className="block text-slate-100 text-4xl sm:text-5xl font-black tracking-wider mt-1">
              Esports League
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Nền tảng quản lý giải đấu chuyên nghiệp — thống kê trận đấu, phân tích phong độ tuyển thủ và dự đoán kết quả theo thời gian thực.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/standings"
              className="relative px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white overflow-hidden group transition-all transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', boxShadow: '0 0 30px rgba(14,165,233,0.35)' }}>
              <span className="relative z-10 flex items-center gap-2">📊 Xem Bảng Xếp Hạng</span>
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"></div>
            </Link>
            <Link to="/schedule"
              className="px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all transform hover:scale-105 hover:bg-cyan-500/5">
              📅 Lịch Thi Đấu
            </Link>
          </div>
        </div>

        {/* ─── STATS BANNER ─── */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
            {heroStats.map((s, i) => (
              <div key={i} className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 text-center group overflow-hidden"
                style={{ '--c': s.color }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at center, ${s.color}10 0%, transparent 70%)` }}></div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-3xl font-black" style={{ color: s.color }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FEATURES GRID ─── */}
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-slate-200 uppercase tracking-wider mb-2">
                Dành Cho Fan
              </h2>
              <p className="text-slate-500 text-sm">Tất cả thông tin bạn cần — không cần đăng nhập</p>
              <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mx-auto mt-3"></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicFeatures.map((f, i) => <FeatureCard key={i} {...f} delay={i * 50} />)}
            </div>
          </div>
        </div>

        {/* ─── AUTH BANNER ─── */}
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto">
            {!isLoggedIn ? (
              <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 pointer-events-none"></div>
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <h3 className="text-2xl font-black text-slate-100 mb-3 uppercase tracking-wide">
                  ⚡ Truy Cập Phân Tích Chuyên Sâu
                </h3>
                <p className="text-slate-400 mb-7 max-w-lg mx-auto leading-relaxed">
                  Đăng nhập với tài khoản <strong className="text-purple-400">Analyst</strong> hoặc <strong className="text-red-400">Admin</strong> để xem phân tích meta, dự đoán kết quả và báo cáo tổng quan mùa giải.
                </p>

                <div className="flex flex-wrap gap-6 justify-center mb-7 text-sm">
                  {[
                    { icon: '🔥', label: 'Meta Tướng Hot', color: 'text-purple-400' },
                    { icon: '⚖️', label: 'So Sánh Tuyển Thủ', color: 'text-cyan-400' },
                    { icon: '🎯', label: 'Dự Đoán Trận Đấu', color: 'text-amber-400' },
                    { icon: '📈', label: 'Báo Cáo Mùa Giải', color: 'text-emerald-400' },
                  ].map(f => (
                    <div key={f.label} className={`flex items-center gap-2 font-semibold ${f.color}`}>
                      <span>{f.icon}</span> {f.label}
                    </div>
                  ))}
                </div>

                <Link to="/login"
                  className="inline-block relative px-10 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white overflow-hidden group transition-all transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', boxShadow: '0 0 25px rgba(14,165,233,0.3)' }}>
                  <span className="relative z-10">Đăng Nhập Ngay →</span>
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"></div>
                </Link>
              </div>
            ) : (
              <div className="bg-emerald-900/20 border border-emerald-500/30 backdrop-blur-md rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-emerald-400 text-lg font-semibold">
                  Chào mừng trở lại, <strong className="text-emerald-300">{user?.username}</strong>!
                </p>
                <p className="text-slate-400 mt-2">
                  Đăng nhập với quyền hạn: <span className="bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-xs font-bold uppercase ml-1 border border-emerald-500/30">{user?.role}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Home;