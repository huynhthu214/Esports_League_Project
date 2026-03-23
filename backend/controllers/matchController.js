// backend/controllers/matchController.js
const { getPool, getMongoDb, sql } = require("../config/db");

exports.submitMatchResult = async (req, res) => {
  const matchData = req.body;
  const mongoDb = getMongoDb();
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  let mongoInserted = false;

  try {
    // BƯỚC 1: Lưu vào MongoDB
    await mongoDb.collection("match_stats").insertOne(matchData);
    mongoInserted = true;

    // BƯỚC 2: Cập nhật MS SQL bằng Transaction
    const winningTeam = matchData.teams.find(
      (t) => t.result === "WIN",
    )?.team_id;
    const losingTeam = matchData.teams.find(
      (t) => t.result === "LOSS",
    )?.team_id;

    if (!winningTeam || !losingTeam) {
      throw new Error("Dữ liệu trận đấu thiếu kết quả WIN/LOSS");
    }

    await transaction.begin();

    await new sql.Request(transaction)
      .input("winTeam", sql.VarChar(10), winningTeam)
      .input("seasonId", sql.VarChar(10), matchData.season_id)
      .query(
        "UPDATE TeamStandings SET Wins = Wins + 1 WHERE TeamID = @winTeam AND SeasonID = @seasonId",
      );

    await new sql.Request(transaction)
      .input("loseTeam", sql.VarChar(10), losingTeam)
      .input("seasonId", sql.VarChar(10), matchData.season_id)
      .query(
        "UPDATE TeamStandings SET Losses = Losses + 1 WHERE TeamID = @loseTeam AND SeasonID = @seasonId",
      );

    await transaction.commit();

    res.status(200).json({
      message: "Dual-write thành công: MongoDB + MS SQL đã cập nhật!",
    });
  } catch (error) {
    console.error("Dual-write error:", error.message);

    // Rollback SQL nếu đang trong transaction
    try {
      await transaction.rollback();
    } catch (_) {}

    // Compensating: xóa document MongoDB nếu đã insert
    if (mongoInserted && matchData.match_id) {
      await mongoDb
        .collection("match_stats")
        .deleteOne({ match_id: matchData.match_id });
    }

    res
      .status(500)
      .json({ error: "Dual-write thất bại, đã rollback toàn bộ." });
  }
};
