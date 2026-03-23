// src/pages/admin/RosterViewer.jsx - (THÚY VI)
// Xem roster đội theo mùa, xóa thành viên khỏi đội
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const POSITION_ORDER = ["Top", "Jungle", "Mid", "ADC", "Support"];
const POSITION_COLOR = {
  Top: "bg-red-50 text-red-700",
  Jungle: "bg-green-50 text-green-700",
  Mid: "bg-blue-50 text-blue-700",
  ADC: "bg-orange-50 text-orange-700",
  Support: "bg-purple-50 text-purple-700",
};

const RosterViewer = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null); // playerId đang xóa
  const [confirm, setConfirm] = useState(null); // { playerId, nickname }

  useEffect(() => {
    axiosClient
      .get("/seasons")
      .then((r) => setSeasons(r.data.data || []))
      .catch(() => {});
    axiosClient
      .get("/teams")
      .then((r) => setTeams(r.data.data || []))
      .catch(() => {});
  }, []);

  const fetchRoster = async () => {
    if (!seasonId || !teamId) return;
    setLoading(true);
    setError("");
    setRoster([]);
    try {
      const res = await axiosClient.get(`/rosters/${teamId}`, {
        params: { seasonId },
      });
      setRoster(res.data.data || []);
    } catch {
      setError("Không thể tải roster. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Xóa thành viên — gọi API PATCH để update status → TRANSFERRED_OUT
  const removePlayer = async (playerId) => {
    setRemoving(playerId);
    try {
      await axiosClient.patch(`/rosters/remove`, {
        playerId,
        teamId,
        seasonId,
      });
      setRoster((prev) => prev.filter((p) => p.PlayerID !== playerId));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa thành viên.");
    } finally {
      setRemoving(null);
    }
  };

  const activeRoster = roster.filter((p) => p.Status === "ACTIVE");
  const inactiveRoster = roster.filter((p) => p.Status !== "ACTIVE");

  const teamName = teams.find((t) => t.TeamID === teamId)?.TeamName || teamId;
  const seasonName =
    seasons.find((s) => s.SeasonID === seasonId)?.SeasonName || seasonId;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">
        Xem & Quản lý Roster
      </h1>
      <p className="text-xs text-gray-400 mb-5">
        Xem thành viên đội theo mùa giải · Xóa = chuyển trạng thái sang
        TRANSFERRED_OUT
      </p>

      {/* Bộ lọc */}
      <div className="flex gap-3 mb-5">
        <select
          value={seasonId}
          onChange={(e) => {
            setSeasonId(e.target.value);
            setRoster([]);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
        >
          <option value="">-- Chọn mùa giải --</option>
          {seasons.map((s) => (
            <option key={s.SeasonID} value={s.SeasonID}>
              {s.SeasonName} ({s.SeasonID})
            </option>
          ))}
        </select>
        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            setRoster([]);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
        >
          <option value="">-- Chọn đội --</option>
          {teams.map((t) => (
            <option key={t.TeamID} value={t.TeamID}>
              {t.TeamName} ({t.TeamID})
            </option>
          ))}
        </select>
        <button
          onClick={fetchRoster}
          disabled={!seasonId || !teamId || loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "Đang tải..." : "Xem Roster"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Kết quả */}
      {roster.length > 0 && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                {teamName}
              </h2>
              <p className="text-xs text-gray-400">
                {seasonName} · {activeRoster.length} thành viên ACTIVE
              </p>
            </div>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                activeRoster.length >= 10
                  ? "bg-red-100 text-red-700"
                  : activeRoster.length >= 5
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {activeRoster.length}/10
            </span>
          </div>

          {/* Danh sách ACTIVE */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Tuyển thủ",
                    "Vị trí",
                    "KDA TB",
                    "GPM TB",
                    "Win%",
                    "Trận",
                    "Ngày vào",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeRoster.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      Không có thành viên ACTIVE.
                    </td>
                  </tr>
                )}
                {activeRoster
                  .sort(
                    (a, b) =>
                      POSITION_ORDER.indexOf(a.Position) -
                      POSITION_ORDER.indexOf(b.Position),
                  )
                  .map((p) => (
                    <tr
                      key={p.PlayerID}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">
                          {p.Nickname}
                        </div>
                        <div className="text-xs text-gray-400">
                          {p.PlayerID}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${POSITION_COLOR[p.Position] || "bg-gray-100 text-gray-600"}`}
                        >
                          {p.Position}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {p.AvgKDA || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {p.AvgGPM ? Number(p.AvgGPM).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {p.WinRate ? `${p.WinRate}%` : "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {p.TotalMatches || 0}
                      </td>
                      <td className="px-3 py-3 text-gray-400 text-xs">
                        {p.JoinDate?.split("T")[0] || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() =>
                            setConfirm({
                              playerId: p.PlayerID,
                              nickname: p.Nickname,
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Danh sách không ACTIVE (nếu có) */}
          {inactiveRoster.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Không còn thi đấu ({inactiveRoster.length} người)
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {inactiveRoster.map((p) => (
                      <tr key={p.PlayerID} className="opacity-60">
                        <td className="px-3 py-2.5">
                          <span className="text-gray-600">{p.Nickname}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            ({p.PlayerID})
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            {p.Position}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            {p.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {confirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              Xác nhận xóa khỏi đội
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Xóa <strong>{confirm.nickname}</strong> khỏi{" "}
              <strong>{teamName}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Trạng thái sẽ chuyển sang TRANSFERRED_OUT. Không thể hoàn tác từ
              giao diện này.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => removePlayer(confirm.playerId, confirm.nickname)}
                disabled={removing === confirm.playerId}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {removing === confirm.playerId ? "Đang xóa..." : "Xóa khỏi đội"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterViewer;
