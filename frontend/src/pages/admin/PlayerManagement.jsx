import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITION_COLOR = {
  Top: "bg-red-500/20 text-red-400 border-red-500/30",
  Jungle: "bg-green-500/20 text-green-400 border-green-500/30",
  Mid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ADC: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Support: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      // Vì API public lấy cả players bị ẩn thì không được, ta lấy tất cả hoặc tạo mới
      // Tạm dùng API /players nhưng nó có thể chỉ lấy Active.
      // Sửa: API getPlayers trong adminController hiện tại có `WHERE IsActive = 1`.
      // Ta tạm dùng nó, sau này nên sửa lại backend lấy tất cả.
      // Đối với hiện tại, tôi sẽ lấy qua API tự viết hoặc /players
      const res = await axiosClient.get("/players");
      setPlayers(res.data.data || []);
      setFilteredPlayers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredPlayers(
      players.filter(
        (p) =>
          p.Nickname?.toLowerCase().includes(q) ||
          p.PlayerID?.toLowerCase().includes(q),
      ),
    );
  }, [search, players]);

  const toggleStatus = async (playerId, isActive) => {
    try {
      if (isActive) {
        await axiosClient.patch(`/players/${playerId}/deactivate`);
        setStatus({
          type: "success",
          text: `Đã ẩn tuyển thủ ${playerId} thành công.`,
        });
      } else {
        await axiosClient.patch(`/players/${playerId}/activate`);
        setStatus({
          type: "success",
          text: `Đã kích hoạt tuyển thủ ${playerId} thành công.`,
        });
      }
      // Update local state temporarily (để khỏi load lại làm giật màn hình)
      setPlayers((prev) =>
        prev.map((p) =>
          p.PlayerID === playerId ? { ...p, IsActive: !isActive } : p,
        ),
      );
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi cập nhật trạng thái.",
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-2">
          ⚙️ Quản Lý Tuyển Thủ
        </h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">
          Ẩn/hiện và tìm kiếm danh sách tuyển thủ hệ thống
        </p>

        {status && (
          <div
            className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
              status.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Tìm kiếm bằng tên hoặc ID (Ví dụ: Levi, P001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Mã TT
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Nickname
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tên Đầy Đủ
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Vị Trí
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Trạng Thái
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10">
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-slate-500"
                    >
                      Không tìm thấy tuyển thủ nào.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p) => (
                    <tr
                      key={p.PlayerID}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-slate-400">
                        {p.PlayerID}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-200">
                        {p.Nickname}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{p.FullName}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md border ${POSITION_COLOR[p.Position] || "bg-slate-700/50 text-slate-300 border-slate-600"}`}
                        >
                          {p.Position}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.IsActive !== 0 ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Bị Ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleStatus(p.PlayerID, p.IsActive !== 0)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                            p.IsActive !== 0
                              ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {p.IsActive !== 0 ? "Xóa Ẩn (Ban)" : "Kích Hoạt Lại"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;
