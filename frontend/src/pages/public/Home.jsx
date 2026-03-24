import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const Home = () => {
  const { isLoggedIn, user } = useAuth(); 

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] relative overflow-hidden font-sans text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hiệu ứng Neon Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">⚔️</div>
          <h1 className="text-5xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 uppercase mb-4">
            Nexus Esports League
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            Hệ thống quản lý giải đấu, thống kê dữ liệu trận đấu và phân tích phong độ tuyển thủ chuyên nghiệp.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <Link
            to="/leaderboard/players"
            className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all duration-300 block transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">🏆</div>
            <div className="text-xl font-bold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">
              Bảng Xếp Hạng KDA
            </div>
            <div className="text-sm text-slate-400">
              Tra cứu top tuyển thủ xuất sắc nhất theo KDA, GPM và các chỉ số toàn mùa giải.
            </div>
          </Link>

          <Link
            to="/standings"
            className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 block transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📊</div>
            <div className="text-xl font-bold text-slate-100 mb-2 group-hover:text-purple-400 transition-colors">
              Xếp Hạng Đội Tuyển
            </div>
            <div className="text-sm text-slate-400">
              Theo dõi bảng điểm, số trận thắng / thua và tỷ lệ thắng của các đội tuyển.
            </div>
          </Link>
        </div>

        {/* Auth Banner */}
        {!isLoggedIn ? (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 text-center shadow-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Truy cập khu vực quản trị</h3>
            <p className="text-slate-400 mb-6 text-sm">
              Đăng nhập với tài khoản Admin, Analyst hoặc Coach để xem thêm các thống kê và phân tích chuyên sâu.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg px-8 py-2.5 text-sm font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-105"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-900/20 border border-emerald-500/30 backdrop-blur-md rounded-2xl p-6 text-center">
            <p className="text-emerald-400">
              Chào mừng trở lại, <strong className="text-emerald-300 text-lg">{user?.username}</strong>! 
              <br/>Bạn đang đăng nhập với quyền hạn: <span className="bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-xs font-bold uppercase ml-2 border border-emerald-500/30">{user?.role}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;