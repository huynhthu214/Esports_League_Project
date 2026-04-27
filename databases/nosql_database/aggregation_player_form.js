// =============================================================
// FILE: aggregation_player_form.js
// MỤC ĐÍCH: Tính form thi đấu của tuyển thủ trong 50 trận gần nhất
// NÂNG CẤP: Thêm KDA động, AvgGPM, WinRate, $bucket phân nhóm
// =============================================================

const { getMongoDb } = require("../../backend/config/db");

/**
 * Pipeline tính chỉ số form của một tuyển thủ (50 trận gần nhất).
 * Gọi: GET /api/analytics/player-form/:playerId
 */
async function getPlayerForm(playerId) {
  const db = getMongoDb();

  const pipeline = [
    // ── STAGE 1: Lọc các document có tuyển thủ này thi đấu ──────────────
    {
      $match: { "teams.players.player_id": playerId },
    },

    // ── STAGE 2: Sắp xếp ngày thi đấu gần nhất lên đầu ─────────────────
    { $sort: { match_date: -1 } },

    // ── STAGE 3: Giới hạn 50 trận gần nhất ──────────────────────────────
    { $limit: 50 },

    // ── STAGE 4: Unwind teams (mỗi document tách thành nhiều team row) ──
    { $unwind: "$teams" },

    // ── STAGE 5: Unwind players trong mỗi team ──────────────────────────
    { $unwind: "$teams.players" },

    // ── STAGE 6: Chỉ giữ lại stats của đúng tuyển thủ cần tính ─────────
    {
      $match: { "teams.players.player_id": playerId },
    },

    // ── STAGE 7: Thêm trường KDA động + cờ thắng/thua ───────────────────
    // KDA = (kills + assists) / max(deaths, 1)  → tránh chia cho 0
    {
      $addFields: {
        "teams.players.kda": {
          $divide: [
            {
              $add: [
                "$teams.players.kills",
                "$teams.players.assists",
              ],
            },
            {
              $max: ["$teams.players.deaths", 1],
            },
          ],
        },
        // Tính GPM (gold per minute) — nếu duration_minutes tồn tại
        "teams.players.gpm": {
          $cond: {
            if: { $gt: ["$duration_minutes", 0] },
            then: {
              $divide: ["$teams.players.gold", "$duration_minutes"],
            },
            else: 0,
          },
        },
        // Cờ: tuyển thủ này có thắng trận không?
        is_win: {
          $cond: {
            if: { $eq: ["$teams.result", "WIN"] },
            then: 1,
            else: 0,
          },
        },
      },
    },

    // ── STAGE 8: Group để tính trung bình toàn bộ 50 trận ───────────────
    {
      $group: {
        _id: "$teams.players.player_id",
        avg_kills:   { $avg: "$teams.players.kills" },
        avg_deaths:  { $avg: "$teams.players.deaths" },
        avg_assists: { $avg: "$teams.players.assists" },
        avg_gold:    { $avg: "$teams.players.gold" },
        avg_kda:     { $avg: "$teams.players.kda" },
        avg_gpm:     { $avg: "$teams.players.gpm" },
        total_wins:  { $sum: "$is_win" },
        total_matches: { $sum: 1 },
        // Giữ lại mảng KDA từng trận để vẽ biểu đồ trend
        kda_trend: { $push: "$teams.players.kda" },
      },
    },

    // ── STAGE 9: Tính win_rate và làm tròn số ───────────────────────────
    {
      $addFields: {
        win_rate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$total_wins", "$total_matches"] },
                100,
              ],
            },
            1,
          ],
        },
        avg_kda:  { $round: ["$avg_kda", 2] },
        avg_gpm:  { $round: ["$avg_gpm", 1] },
        avg_kills:   { $round: ["$avg_kills", 1] },
        avg_deaths:  { $round: ["$avg_deaths", 1] },
        avg_assists: { $round: ["$avg_assists", 1] },
      },
    },
  ];

  // ── PIPELINE 2: Phân nhóm performance bằng $bucket ──────────────────────
  // Chạy riêng để lấy phân phối KDA theo các ngưỡng
  const bucketPipeline = [
    { $match: { "teams.players.player_id": playerId } },
    { $sort: { match_date: -1 } },
    { $limit: 50 },
    { $unwind: "$teams" },
    { $unwind: "$teams.players" },
    { $match: { "teams.players.player_id": playerId } },
    {
      $addFields: {
        "teams.players.kda": {
          $divide: [
            { $add: ["$teams.players.kills", "$teams.players.assists"] },
            { $max: ["$teams.players.deaths", 1] },
          ],
        },
      },
    },
    // $bucket phân nhóm KDA: Poor < 2 | Average 2-4 | Good 4-6 | Excellent > 6
    {
      $bucket: {
        groupBy: "$teams.players.kda",
        boundaries: [0, 2, 4, 6],
        default: "Excellent (6+)",
        output: {
          count: { $sum: 1 },
          players: { $push: "$teams.players.player_id" },
          avg_kills_in_bracket: { $avg: "$teams.players.kills" },
        },
      },
    },
    // Đặt nhãn dễ đọc cho từng bucket
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

  const [formStats, kdaDistribution] = await Promise.all([
    db.collection("match_stats").aggregate(pipeline).toArray(),
    db.collection("match_stats").aggregate(bucketPipeline).toArray(),
  ]);

  return {
    player_id: playerId,
    form: formStats[0] || null,
    kda_distribution: kdaDistribution,
  };
}

module.exports = { getPlayerForm };
