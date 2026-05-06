import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const POSITION_COLOR = {
  Top: "bg-red-500/20 text-red-400 border-red-500/30",
  Jungle: "bg-green-500/20 text-green-400 border-green-500/30",
  Mid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ADC: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Support: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient
      .get(`/admin/players/${id}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Lỗi khi lấy dữ liệu tuyển thủ",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex-1 flex justify-center items-center h-[calc(100vh-80px)] bg-[#050c18]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );

  if (error || !profile)
    return (
      <div className="flex-1 flex justify-center items-center h-[calc(100vh-80px)] bg-[#050c18] text-slate-200">
        <div className="text-center p-8 bg-slate-900/60 rounded-2xl border border-slate-800">
          <h2 className="text-2xl font-black text-red-400 mb-2">
            Không tìm thấy
          </h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );

  const { info, seasonStats, transfers } = profile;

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
        >
          ← Quay lại
        </button>

        {/* Header Profile */}
        <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-[0_0_40px_rgba(6,182,212,0.05)]">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 transform rotate-3">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-purple-400">
              {info.Nickname.substring(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-black italic tracking-wider text-white drop-shadow-sm">
                {info.Nickname}
              </h1>
              {!info.IsActive && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30">
                  Ngừng thi đấu
                </span>
              )}
            </div>
            <p className="text-slate-400 font-medium mb-4">
              {info.FullName} • {info.PlayerID}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span
                className={`px-4 py-1.5 rounded-xl font-bold text-sm border shadow-sm ${POSITION_COLOR[info.Position] || "bg-slate-800 text-slate-300 border-slate-700"}`}
              >
                {info.Position}
              </span>
              <span className="px-4 py-1.5 rounded-xl bg-slate-800/50 text-slate-300 font-bold text-sm border border-slate-700">
                {seasonStats.length > 0 ? seasonStats[0].TeamName : "Tự do"}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 text-center min-w-[100px]">
              <div className="text-3xl font-black text-cyan-400">
                {seasonStats.reduce((sum, s) => sum + s.TotalMatches, 0)}
              </div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                Trận đấu
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lịch sử theo mùa */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">
                Thống kê theo mùa
              </h2>
              {seasonStats.length === 0 ? (
                <p className="text-slate-500 italic">
                  Chưa có dữ liệu thi đấu.
                </p>
              ) : (
                <div className="space-y-4">
                  {seasonStats.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-bold text-lg text-slate-200">
                          {s.SeasonName}
                        </div>
                        <div className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">
                          {s.TeamName}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                        <div>
                          <div className="text-lg font-black text-slate-300">
                            {s.TotalMatches}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Trận
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-emerald-400">
                            {s.AvgKDA?.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            KDA
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-amber-400">
                            {s.AvgGPM?.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            GPM
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-purple-400">
                            {s.WinRate?.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Win Rate
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lịch sử chuyển nhượng */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">
                Chuyển nhượng
              </h2>
              {transfers.length === 0 ? (
                <p className="text-slate-500 italic">
                  Chưa có bản ghi chuyển nhượng.
                </p>
              ) : (
                <div className="relative border-l border-slate-700 ml-3 space-y-6">
                  {transfers.map((t, idx) => (
                    <div key={idx} className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                      <div className="text-xs font-bold text-slate-400 mb-1">
                        {new Date(t.TransferDate).toLocaleDateString("vi-VN")} •{" "}
                        {t.SeasonName}
                      </div>
                      <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl">
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span className="text-slate-300">
                            {t.FromTeam || "Tự do"}
                          </span>
                          <span className="text-slate-500 text-xs">→</span>
                          <span className="text-cyan-300">
                            {t.ToTeam || "Tự do"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
