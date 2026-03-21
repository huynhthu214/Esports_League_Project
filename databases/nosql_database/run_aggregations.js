// FILE: run_aggregations.js
const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/";
const SEASON = "SS2025";
const PLAYER = "P001";

async function run() {
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 30000,
  });
  try {
    await client.connect();
    console.log("✅ Kết nối MongoDB Atlas thành công!\n");
    const col = client.db("esports_league").collection("match_stats");

    // Pipeline 1: Leaderboard KDA
    console.log("===== LEADERBOARD TOP 20 KDA =====");
    const leaderboard = await col
      .aggregate([
        { $match: { season_id: SEASON } },
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        {
          $group: {
            _id: "$teams.players.player_id",
            total_kills: { $sum: "$teams.players.kills" },
            total_deaths: { $sum: "$teams.players.deaths" },
            total_assists: { $sum: "$teams.players.assists" },
            matches_played: { $sum: 1 },
          },
        },
        {
          $addFields: {
            kda: {
              $cond: [
                { $eq: ["$total_deaths", 0] },
                { $add: ["$total_kills", "$total_assists"] },
                {
                  $divide: [
                    { $add: ["$total_kills", "$total_assists"] },
                    "$total_deaths",
                  ],
                },
              ],
            },
          },
        },
        { $sort: { kda: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    leaderboard.forEach((p, i) => {
      console.log(
        `#${i + 1} ${p._id} | KDA: ${p.kda.toFixed(2)} | Trận: ${p.matches_played} | K/D/A: ${p.total_kills}/${p.total_deaths}/${p.total_assists}`,
      );
    });

    // Pipeline 2: Player Form
    console.log(`\n===== PHONG ĐỘ ${PLAYER} (50 trận gần nhất) =====`);
    const form = await col
      .aggregate([
        { $match: { season_id: SEASON, "teams.players.player_id": PLAYER } },
        { $sort: { match_date: -1 } },
        { $limit: 50 },
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        { $match: { "teams.players.player_id": PLAYER } },
        {
          $group: {
            _id: "$teams.players.player_id",
            avg_kills: { $avg: "$teams.players.kills" },
            avg_deaths: { $avg: "$teams.players.deaths" },
            avg_assists: { $avg: "$teams.players.assists" },
            avg_gold: { $avg: "$teams.players.gold" },
            total_matches: { $sum: 1 },
            wins: {
              $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
            },
          },
        },
        {
          $addFields: {
            avg_kda: {
              $cond: [
                { $eq: ["$avg_deaths", 0] },
                { $add: ["$avg_kills", "$avg_assists"] },
                {
                  $divide: [
                    { $add: ["$avg_kills", "$avg_assists"] },
                    "$avg_deaths",
                  ],
                },
              ],
            },
            win_rate: {
              $multiply: [{ $divide: ["$wins", "$total_matches"] }, 100],
            },
          },
        },
      ])
      .toArray();

    if (form.length) {
      const f = form[0];
      console.log(`Tuyển thủ  : ${f._id}`);
      console.log(`Số trận    : ${f.total_matches}`);
      console.log(`Avg KDA    : ${f.avg_kda.toFixed(2)}`);
      console.log(`Avg Kills  : ${f.avg_kills.toFixed(1)}`);
      console.log(`Avg Deaths : ${f.avg_deaths.toFixed(1)}`);
      console.log(`Avg Gold   : ${Math.round(f.avg_gold)}`);
      console.log(
        `Win Rate   : ${f.win_rate.toFixed(1)}%  (${f.wins}W - ${f.total_matches - f.wins}L)`,
      );
    } else {
      console.log(`Không tìm thấy dữ liệu cho ${PLAYER}`);
    }

    // Pipeline 3: Meta Heroes
    console.log("\n===== TOP 10 TƯỚNG META =====");
    const meta = await col
      .aggregate([
        { $match: { season_id: SEASON } },
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        { $group: { _id: "$teams.players.hero", pick_count: { $sum: 1 } } },
        { $sort: { pick_count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    if (meta.length && meta[0]._id !== null) {
      meta.forEach((h, i) =>
        console.log(`#${i + 1} ${h._id} - ${h.pick_count} lần pick`),
      );
    } else {
      console.log(
        "⚠️  Field 'hero' chưa có trong data - cần Member 2 bổ sung vào generate_data.py",
      );
    }

    console.log("\n✅ Tất cả pipelines chạy xong!");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await client.close();
  }
}

run();
