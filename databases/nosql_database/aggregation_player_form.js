// =============================================================
// FILE: aggregation_player_form.js
// MỤC ĐÍCH: Tài liệu hóa pipeline phân tích phong độ tuyển thủ
//           (dùng để đọc hiểu và demo — logic thực thi nằm trong
//            backend/controllers/analyticsController.js)
//
// PIPELINE NÂNG CAO (có kda_trend + $bucket phân nhóm):
//   Dùng khi cần biểu đồ trend từng trận và phân phối KDA.
//   Controller hiện dùng phiên bản rút gọn (chỉ aggregate tổng).
//   Hai phiên bản cho kết quả tương đương ở mức avg — xem ghi chú
//   về "per-game KDA" vs "average-of-averages" bên dưới.
// =============================================================

/**
 * PIPELINE CHÍNH — Phong độ 50 trận gần nhất
 * Trả về: avg_kills, avg_deaths, avg_assists, avg_gold,
 *          avg_kda (per-game), avg_gpm, win_rate, kda_trend[]
 *
 * Ghi chú kỹ thuật — KDA per-game vs average-of-averages:
 *   - avg_kda ở đây = avg(kda_mỗi_trận) = avg((K+A)/max(D,1))
 *   - Controller dùng: (avg_K + avg_A) / avg_D  ← kết quả tương tự
 *     nhưng không hoàn toàn bằng nhau về mặt toán học.
 *   - Cách này (per-game) chính xác hơn vì tránh bị lệch khi
 *     một trận có deaths=0 kéo avg_D xuống thấp.
 */
const playerFormPipeline = (playerId) => [
  // STAGE 1: Lọc document có tuyển thủ thi đấu
  { $match: { "teams.players.player_id": playerId } },

  // STAGE 2: Sắp xếp ngày gần nhất lên đầu
  { $sort: { match_date: -1 } },

  // STAGE 3: Chỉ lấy 50 trận gần nhất (TRƯỚC khi unwind để tối ưu)
  { $limit: 50 },

  // STAGE 4-5: Tách teams và players thành từng dòng riêng
  { $unwind: "$teams" },
  { $unwind: "$teams.players" },

  // STAGE 6: Chỉ giữ dòng đúng tuyển thủ cần tính
  { $match: { "teams.players.player_id": playerId } },

  // STAGE 7: Tính KDA per-game và GPM trước khi group
  // KDA = (kills + assists) / max(deaths, 1) — tránh chia 0
  {
    $addFields: {
      __kda: {
        $divide: [
          { $add: ["$teams.players.kills", "$teams.players.assists"] },
          { $max: ["$teams.players.deaths", 1] },
        ],
      },
      __gpm: {
        $cond: {
          if: { $gt: ["$duration_minutes", 0] },
          then: { $divide: ["$teams.players.gold", "$duration_minutes"] },
          else: 0,
        },
      },
      __win: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
    },
  },

  // STAGE 8: Gom tất cả 50 trận thành 1 document tổng hợp
  {
    $group: {
      _id: "$teams.players.player_id",
      avg_kills: { $avg: "$teams.players.kills" },
      avg_deaths: { $avg: "$teams.players.deaths" },
      avg_assists: { $avg: "$teams.players.assists" },
      avg_gold: { $avg: "$teams.players.gold" },
      avg_kda: { $avg: "$__kda" }, // per-game KDA, chính xác hơn
      avg_gpm: { $avg: "$__gpm" },
      total_wins: { $sum: "$__win" },
      total_matches: { $sum: 1 },
      kda_trend: { $push: "$__kda" }, // mảng KDA từng trận → vẽ line chart
    },
  },

  // STAGE 9: Tính win_rate và làm tròn
  {
    $addFields: {
      win_rate: {
        $round: [
          { $multiply: [{ $divide: ["$total_wins", "$total_matches"] }, 100] },
          1,
        ],
      },
      avg_kda: { $round: ["$avg_kda", 2] },
      avg_gpm: { $round: ["$avg_gpm", 1] },
      avg_kills: { $round: ["$avg_kills", 1] },
      avg_deaths: { $round: ["$avg_deaths", 1] },
      avg_assists: { $round: ["$avg_assists", 1] },
    },
  },
];

/**
 * PIPELINE PHỤ — Phân nhóm KDA bằng $bucket
 * Dùng để vẽ biểu đồ phân phối hiệu suất (histogram):
 *   Poor: KDA < 2 | Average: 2–4 | Good: 4–6 | Excellent: 6+
 */
const kdaBucketPipeline = (playerId) => [
  { $match: { "teams.players.player_id": playerId } },
  { $sort: { match_date: -1 } },
  { $limit: 50 },
  { $unwind: "$teams" },
  { $unwind: "$teams.players" },
  { $match: { "teams.players.player_id": playerId } },
  {
    $addFields: {
      __kda: {
        $divide: [
          { $add: ["$teams.players.kills", "$teams.players.assists"] },
          { $max: ["$teams.players.deaths", 1] },
        ],
      },
    },
  },
  {
    $bucket: {
      groupBy: "$__kda",
      boundaries: [0, 2, 4, 6],
      default: "Excellent (6+)",
      output: {
        count: { $sum: 1 },
        avg_kills_in_bracket: { $avg: "$teams.players.kills" },
      },
    },
  },
  {
    $addFields: {
      performance_label: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "Poor (KDA < 2)" },
            { case: { $eq: ["$_id", 2] }, then: "Average (KDA 2–4)" },
            { case: { $eq: ["$_id", 4] }, then: "Good (KDA 4–6)" },
          ],
          default: "Excellent (KDA 6+)",
        },
      },
    },
  },
];

module.exports = { playerFormPipeline, kdaBucketPipeline };
