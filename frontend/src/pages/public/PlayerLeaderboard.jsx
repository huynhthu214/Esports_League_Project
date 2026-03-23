// src/pages/public/PlayerLeaderboard.jsx - (THÚY VI)
// Dùng GET /api/leaderboards/players?seasonId=SS2025&position=...
// Fields từ vw_Leaderboard_KDA:
//   KDA_Rank, PlayerID, Nickname, Position, TeamName, TeamShort,
//   SeasonName, SeasonID, TotalMatches, TotalKills, TotalDeaths, TotalAssists,
//   AvgKDA, AvgGPM, WinRate, Position_Rank, GPM_Rank
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITIONS = ["", "Top", "Jungle", "Mid", "ADC", "Support"];
const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const kdaBadge = (kda) => {
  if (kda >= 8) return "bg-purple-100 text-purple-800";
  if (kda >= 5) return "bg-green-100 text-green-700";
  if (kda >= 3) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
};

const PlayerLeaderboard = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("SS2025");
  const [position, setPosition] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load danh sách seasons cho dropdown
  useEffect(() => {
    axiosClient
      .get("/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
  }, []);

  // Load leaderboard khi seasonId hoặc position thay đổi
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
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            🏆 Bảng xếp hạng KDA
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Dùng <code className="bg-gray-100 px-1 rounded">DENSE_RANK()</code>{" "}
            — xử lý đồng hạng · Tối thiểu 5 trận
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            {seasons.map((s) => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.SeasonName}
              </option>
            ))}
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p || "Tất cả vị trí"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Hạng",
                  "Tuyển thủ",
                  "Vị trí",
                  "Đội",
                  "Trận",
                  "K",
                  "D",
                  "A",
                  "KDA TB",
                  "GPM TB",
                  "Win%",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Chưa có dữ liệu cho mùa giải này.
                  </td>
                </tr>
              )}
              {data.map((row) => (
                <tr
                  key={row.PlayerID}
                  className={`hover:bg-gray-50 transition-colors ${row.KDA_Rank <= 3 ? "font-medium" : ""}`}
                >
                  <td className="px-3 py-3 text-center text-base">
                    {MEDAL[row.KDA_Rank] || (
                      <span className="text-gray-500 text-sm">
                        {row.KDA_Rank}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-800">{row.Nickname}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {row.Position}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs">
                    {row.TeamShort}
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {row.TotalMatches}
                  </td>
                  <td className="px-3 py-3 text-green-600 font-medium">
                    {row.TotalKills}
                  </td>
                  <td className="px-3 py-3 text-red-500">{row.TotalDeaths}</td>
                  <td className="px-3 py-3 text-blue-500">
                    {row.TotalAssists}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${kdaBadge(row.AvgKDA)}`}
                    >
                      {row.AvgKDA}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {Number(row.AvgGPM).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-gray-500">{row.WinRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayerLeaderboard;
