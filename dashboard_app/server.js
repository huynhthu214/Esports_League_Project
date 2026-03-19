const express = require("express");
const oracledb = require("oracledb");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CẤU HÌNH CƠ SỞ DỮ LIỆU
// ==========================================
const uri =
  "mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/";
const client = new MongoClient(uri);
let mongoDb;

async function initMongo() {
  try {
    await client.connect();
    mongoDb = client.db("esports_league");
    console.log("Đã kết nối MongoDB Atlas thành công!");
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err);
  }
}
initMongo();

const oracleConfig = {
  user: "YOUR_ORACLE_USER",
  password: "YOUR_ORACLE_PASSWORD",
  connectString: "localhost:1521/XEPDB1",
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// API 1: Lấy Bảng Xếp Hạng KDA (Giữ nguyên như cũ)
app.get("/api/leaderboard", async (req, res) => {
  // ... (Giữ nguyên code pipeline của bạn ở đây) ...
});

// API 2: Nhập kết quả trận đấu (Dual-write) (Giữ nguyên như cũ)
app.post("/api/matches/result", async (req, res) => {
  // ... (Giữ nguyên code dual-write của bạn ở đây) ...
});

// API 3: Phân tích Meta Tướng (Từ aggregation_meta_heroes.js)
app.get("/api/analytics/meta-heroes", async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$teams" },
      { $unwind: "$teams.players" },
      {
        $group: {
          _id: "$teams.players.hero",
          pick_count: { $sum: 1 },
        },
      },
      { $sort: { pick_count: -1 } },
      { $limit: 10 },
    ];

    const result = await mongoDb
      .collection("match_stats")
      .aggregate(pipeline)
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API 4: Phân tích Form Tuyển Thủ (Từ aggregation_player_form.js)
// Sử dụng tham số /:playerId trên URL để truy vấn linh hoạt
app.get("/api/analytics/player-form/:playerId", async (req, res) => {
  try {
    const playerId = req.params.playerId; // Lấy ID từ URL (VD: /api/analytics/player-form/P001)

    const pipeline = [
      { $match: { "teams.players.player_id": playerId } },
      { $sort: { match_date: -1 } },
      { $limit: 50 }, // Lấy 50 trận gần nhất
      { $unwind: "$teams" },
      { $unwind: "$teams.players" },
      { $match: { "teams.players.player_id": playerId } },
      {
        $group: {
          _id: "$teams.players.player_id",
          avg_kills: { $avg: "$teams.players.kills" },
          avg_deaths: { $avg: "$teams.players.deaths" },
          avg_assists: { $avg: "$teams.players.assists" },
          avg_gold: { $avg: "$teams.players.gold" },
          total_matches: { $sum: 1 },
        },
      },
    ];

    const result = await mongoDb
      .collection("match_stats")
      .aggregate(pipeline)
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Khởi động Server
app.listen(3000, () =>
  console.log("Server đang chạy tại http://localhost:3000"),
);
