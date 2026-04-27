import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const POSITIONS = ["", "Top", "Jungle", "Mid", "ADC", "Support"];
const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Đổi màu Badge sang tone Tối & Neon
const kdaBadge = (kda) => {
  if (kda >= 8) return "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
  if (kda >= 5) return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
  if (kda >= 3) return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
  return "bg-slate-700/50 text-slate-300 border border-slate-600";
};

const PlayerLeaderboard = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("SS2025");
  const [position, setPosition] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    
    axiosClient.get("/seasons").then((r) => setSeasons(r.data.data || [])).catch(() => {});
    
    // Dữ liệu giả lập để test UI
    setSeasons([{ SeasonID: "SS2025", SeasonName: "Mùa Xuân 2025" }]);
    setData([
      { PlayerID: "P1", KDA_Rank: 1, Nickname: "Levi", Position: "Jungle", TeamShort: "GAM", TotalMatches: 15, TotalKills: 60, TotalDeaths: 10, TotalAssists: 80, AvgKDA: 14.0, AvgGPM: 850, WinRate: 85 },
      { PlayerID: "P2", KDA_Rank: 2, Nickname: "Kati", Position: "Mid", TeamShort: "GAM", TotalMatches: 15, TotalKills: 55, TotalDeaths: 12, TotalAssists: 70, AvgKDA: 10.4, AvgGPM: 820, WinRate: 85 },
      { PlayerID: "P3", KDA_Rank: 4, Nickname: "Shogun", Position: "ADC", TeamShort: "SGB", TotalMatches: 14, TotalKills: 40, TotalDeaths: 20, TotalAssists: 45, AvgKDA: 4.25, AvgGPM: 780, WinRate: 50 },
    ]);
    setLoading(false);
  }, []);

   useEffect(() => {
    if (!seasonId) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { seasonId };
        if (position) params.position = position;
        const r = await axiosClient.get("/leaderboards/players", { params });
        setData(r.data.data || []);
      } catch {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId, position]);

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-2">
              🏆 Bảng xếp hạng KDA
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Chỉ số tính trên các tuyển thủ có tối thiểu 5 trận thi đấu.
            </p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
            >
              {seasons.map((s) => (
                <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>
              ))}
            </select>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p || "Tất cả vị trí"}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    {["Hạng", "Tuyển thủ", "Vị trí", "Đội", "Trận", "K", "D", "A", "KDA TB", "GPM TB", "Win%"].map((h) => (
                      <th key={h} className="px-5 py-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-12 text-center text-slate-500 font-medium">
                        Chưa có dữ liệu cho mùa giải này.
                      </td>
                    </tr>
                  )}
                  {data.map((row) => (
                    <tr 
                      key={row.PlayerID} 
                      className="hover:bg-slate-800/40 transition-colors duration-200 group"
                    >
                      <td className="px-5 py-4 text-center text-xl">
                        {MEDAL[row.KDA_Rank] || <span className="text-slate-500 text-sm font-bold">{row.KDA_Rank}</span>}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        <Link to={`/players/${row.PlayerID}`} className="hover:underline">
                          {row.Nickname}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {row.Position}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-400">{row.TeamShort}</td>
                      <td className="px-5 py-4 text-slate-300 font-medium">{row.TotalMatches}</td>
                      <td className="px-5 py-4 text-emerald-400 font-bold">{row.TotalKills}</td>
                      <td className="px-5 py-4 text-red-400 font-bold">{row.TotalDeaths}</td>
                      <td className="px-5 py-4 text-cyan-400 font-bold">{row.TotalAssists}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide ${kdaBadge(row.AvgKDA)}`}>
                          {row.AvgKDA.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-amber-400 font-medium">{Number(row.AvgGPM).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-300 font-medium">{row.WinRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLeaderboard;