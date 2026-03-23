// src/pages/public/Home.jsx - Trang chủ công khai
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const Home = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">⚔️</div>
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">
          Esports League
        </h1>
        <p className="text-gray-500">
          Hệ thống quản lý và phân tích giải đấu Esports
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/leaderboard/players"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-medium text-gray-800">Bảng xếp hạng KDA</div>
          <div className="text-xs text-gray-400 mt-1">
            Top tuyển thủ theo KDA toàn mùa
          </div>
        </Link>
        <Link
          to="/standings"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-medium text-gray-800">Xếp hạng đội tuyển</div>
          <div className="text-xs text-gray-400 mt-1">
            Bảng điểm thắng / thua / tỷ lệ
          </div>
        </Link>
      </div>

      {!isLoggedIn ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <p className="text-sm text-blue-700 mb-3">
            Đăng nhập để xem thêm thống kê và phân tích chuyên sâu.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          Chào mừng trở lại, <strong>{user.username}</strong>! Bạn đang đăng
          nhập với role <strong>{user.role}</strong>.
        </div>
      )}
    </div>
  );
};

export default Home;
