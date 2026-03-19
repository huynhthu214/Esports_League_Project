const express = require("express");
const oracledb = require("oracledb");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors()); // Cho phép Frontend truy cập API
app.use(express.json()); // BẮT BUỘC: Để Express có thể đọc được dữ liệu JSON gửi lên từ method POST

// ==========================================
// CẤU HÌNH CƠ SỞ DỮ LIỆU
// ==========================================

// 1. Cấu hình MongoDB Atlas
// Lưu ý: Trong thực tế, chuỗi URI này nên được đưa vào file .env để bảo mật
const uri =
  "mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/";
const client = new MongoClient(uri);
let mongoDb;

// Khởi tạo kết nối MongoDB 1 lần khi start server (Best Practice)
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

// 2. Cấu hình Oracle SQL (Điền thông tin thật của CSDL Oracle bạn đang dùng)
const oracleConfig = {
  user: "YOUR_ORACLE_USER", // Thay bằng user Oracle của bạn
  password: "YOUR_ORACLE_PASSWORD", // Thay bằng password Oracle
  connectString: "localhost:1521/XEPDB1", // Thay bằng chuỗi kết nối của bạn (vd: orcl)
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// API 1: Lấy Bảng Xếp Hạng KDA (Đọc từ MongoDB)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$teams" },
      { $unwind: "$teams.players" },
      {
        $group: {
          _id: "$teams.players.player_id",
          total_kills: { $sum: "$teams.players.kills" },
          total_deaths: { $sum: "$teams.players.deaths" },
          total_assists: { $sum: "$teams.players.assists" },
        },
      },
      {
        $addFields: {
          kda: {
            $cond: [
              { $eq: ["$total_deaths", 0] },
              "$total_kills",
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
      { $limit: 10 },
    ];

    // Tận dụng kết nối mongoDb đã khởi tạo ở trên thay vì connect lại mỗi lần gọi API
    const result = await mongoDb
      .collection("match_stats")
      .aggregate(pipeline)
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API 2: Nhập kết quả trận đấu (Ghi vào Mongo + Cập nhật Oracle)
app.post("/api/matches/result", async (req, res) => {
  const matchData = req.body;
  let oracleConnection;

  try {
    // BƯỚC 1: LƯU LOG CHI TIẾT VÀO MONGODB
    await mongoDb.collection("match_stats").insertOne(matchData);

    // BƯỚC 2: CẬP NHẬT TRẠNG THÁI VÀO ORACLE SQL
    // Trích xuất đội thắng/thua từ JSON gửi lên
    const winningTeam = matchData.teams.find((t) => t.result === "WIN").team_id;
    const losingTeam = matchData.teams.find((t) => t.result === "LOSS").team_id;
    const seasonId = matchData.season_id; // Đảm bảo JSON có gửi lên season_id

    oracleConnection = await oracledb.getConnection(oracleConfig);

    // Bắt đầu Transaction trong Oracle (autoCommit: false)
    const sqlUpdateWin = `UPDATE TeamStandings SET Wins = Wins + 1 WHERE TeamID = :teamId AND SeasonID = :seasonId`;
    const sqlUpdateLoss = `UPDATE TeamStandings SET Losses = Losses + 1 WHERE TeamID = :teamId AND SeasonID = :seasonId`;

    await oracleConnection.execute(
      sqlUpdateWin,
      { teamId: winningTeam, seasonId: seasonId },
      { autoCommit: false },
    );
    await oracleConnection.execute(
      sqlUpdateLoss,
      { teamId: losingTeam, seasonId: seasonId },
      { autoCommit: false },
    );

    // Commit nếu cả 2 update đều thành công
    await oracleConnection.commit();

    res.status(200).json({
      message: "Nhập kết quả thành công, đã đồng bộ MongoDB và Oracle!",
    });
  } catch (error) {
    console.error("Lỗi đồng bộ dữ liệu:", error);

    // BƯỚC 3: XỬ LÝ LỖI (Compensating Transaction)
    // Nếu cập nhật Oracle thất bại, ta rollback Oracle
    if (oracleConnection) {
      await oracleConnection.rollback();
    }

    // Xóa document vừa thêm vào MongoDB để đảm bảo tính nhất quán dữ liệu
    if (matchData.match_id) {
      await mongoDb
        .collection("match_stats")
        .deleteOne({ match_id: matchData.match_id });
    }

    res
      .status(500)
      .json({ error: "Lỗi hệ thống, giao dịch đã được hoàn tác." });
  } finally {
    // Luôn luôn đóng kết nối Oracle sau khi xong việc
    if (oracleConnection) {
      try {
        await oracleConnection.close();
      } catch (err) {
        console.error("Lỗi khi đóng kết nối Oracle:", err);
      }
    }
  }
});

// Khởi động Server
app.listen(3000, () =>
  console.log("Server đang chạy tại http://localhost:3000"),
);
