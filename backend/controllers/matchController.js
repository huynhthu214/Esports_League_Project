// backend/controllers/matchController.js
// ✅ FIX: Bỏ cột m.Stage (không tồn tại trong bảng Matches)
// Thay bằng m.Format để hiển thị định dạng (BO3/BO5)

const { sql, getPool, getMongoDb } = require("../config/db");
const { ObjectId } = require("mongodb");

// ================================================================
// NHẬP KẾT QUẢ TRẬN ĐẤU — Dual-write SQL + MongoDB
// POST /api/admin/matches
// ================================================================
exports.submitMatchResult = async (req, res) => {
  const matchData = req.body;
  const mongoDb = getMongoDb();
  const transaction = new sql.Transaction(getPool());
  let mongoInsertedId = null;

  try {
    const insertResult = await mongoDb.collection("match_stats").insertOne({
      ...matchData,
      createdAt: new Date(),
    });
    mongoInsertedId = insertResult.insertedId;

    const winningTeam = matchData.teams?.find(
      (t) => t.result === "WIN",
    )?.team_id;
    const losingTeam = matchData.teams?.find(
      (t) => t.result === "LOSS",
    )?.team_id;

    if (!winningTeam || !losingTeam || !matchData.season_id) {
      throw new Error(
        "Dữ liệu không hợp lệ: Thiếu team WIN/LOSS hoặc season_id.",
      );
    }

    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input("WinTeam", sql.VarChar(10), winningTeam);
    request.input("LoseTeam", sql.VarChar(10), losingTeam);
    request.input("SeasonId", sql.VarChar(10), matchData.season_id);

    await request.query(`
      UPDATE TeamStandings SET Wins = Wins + 1
      WHERE TeamID = @WinTeam AND SeasonID = @SeasonId
    `);
    await request.query(`
      UPDATE TeamStandings SET Losses = Losses + 1
      WHERE TeamID = @LoseTeam AND SeasonID = @SeasonId
    `);

    await transaction.commit();
    res.status(200).json({ message: "Dual-write thành công!" });
  } catch (error) {
    console.error("❌ Lỗi Dual-write:", error);
    try {
      await transaction.rollback();
    } catch {}
    if (mongoInsertedId) {
      await mongoDb
        .collection("match_stats")
        .deleteOne({ _id: mongoInsertedId });
    }
    res.status(500).json({ error: error.message || "Lỗi hệ thống." });
  }
};

// ================================================================
// LỊCH THI ĐẤU — các trận sắp diễn ra (chưa có WinnerTeamID)
// GET /api/admin/matches/schedule?seasonId=SS2025
// ✅ FIX: Bỏ m.Stage → dùng m.Format
// ================================================================
exports.getMatchSchedule = async (req, res) => {
  const { seasonId } = req.query;
  if (!seasonId) return res.status(400).json({ message: "Thiếu seasonId." });

  try {
    const result = await getPool()
      .request()
      .input("sid", sql.VarChar(10), seasonId).query(`
        SELECT
            m.MatchID,
            m.MatchDate,
            m.Format,
            m.Venue,
            t1.TeamName  AS Team1Name,
            t1.ShortName AS Team1Short,
            t2.TeamName  AS Team2Name,
            t2.ShortName AS Team2Short,
            s.SeasonName
        FROM Matches m
        JOIN Teams   t1 ON t1.TeamID  = m.Team1ID
        JOIN Teams   t2 ON t2.TeamID  = m.Team2ID
        JOIN Seasons s  ON s.SeasonID = m.SeasonID
        WHERE m.SeasonID      = @sid
          AND m.WinnerTeamID IS NULL
        ORDER BY m.MatchDate ASC
      `);
    res.json({ data: result.recordset, seasonId });
  } catch (err) {
    console.error("getMatchSchedule:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy lịch thi đấu." });
  }
};

// ================================================================
// LỊCH SỬ TRẬN ĐẤU — các trận đã có kết quả
// GET /api/admin/matches/history?seasonId=SS2025&limit=20
// ✅ FIX: Bỏ m.Stage → dùng m.Format, thêm m.Venue
// ================================================================
exports.getMatchHistory = async (req, res) => {
  const { seasonId, limit = 20 } = req.query;
  if (!seasonId) return res.status(400).json({ message: "Thiếu seasonId." });

  const safeLimit = Math.min(parseInt(limit) || 20, 100);

  try {
    const result = await getPool()
      .request()
      .input("sid", sql.VarChar(10), seasonId).query(`
        SELECT TOP (${safeLimit})
            m.MatchID,
            m.MatchDate,
            m.Format,
            m.Venue,
            m.Team1Score,
            m.Team2Score,
            m.DurationMinutes,
            t1.TeamName  AS Team1Name,
            t1.ShortName AS Team1Short,
            t2.TeamName  AS Team2Name,
            t2.ShortName AS Team2Short,
            tw.TeamName  AS WinnerName,
            tw.ShortName AS WinnerShort,
            p.Nickname   AS MVPNickname,
            s.SeasonName
        FROM Matches m
        JOIN Teams   t1 ON t1.TeamID  = m.Team1ID
        JOIN Teams   t2 ON t2.TeamID  = m.Team2ID
        JOIN Seasons s  ON s.SeasonID = m.SeasonID
        LEFT JOIN Teams   tw ON tw.TeamID   = m.WinnerTeamID
        LEFT JOIN Players p  ON p.PlayerID  = m.MVPPlayerID
        WHERE m.SeasonID       = @sid
          AND m.WinnerTeamID IS NOT NULL
        ORDER BY m.MatchDate DESC
      `);
    res.json({ data: result.recordset, seasonId });
  } catch (err) {
    console.error("getMatchHistory:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy lịch sử trận đấu." });
  }
};

// ================================================================
// CHI TIẾT TRẬN ĐẤU — lấy thêm stats từ MongoDB
// GET /api/admin/matches/:matchId/detail
// ✅ FIX: Bỏ m.Stage → dùng m.Format, m.Venue
// ================================================================
exports.getMatchDetail = async (req, res) => {
  const { matchId } = req.params;
  try {
    const sqlResult = await getPool()
      .request()
      .input("mid", sql.VarChar(20), matchId).query(`
        SELECT
            m.MatchID,
            m.MatchDate,
            m.Format,
            m.Venue,
            m.Team1Score,
            m.Team2Score,
            m.DurationMinutes,
            m.MongoMatchRef,
            t1.TeamName  AS Team1Name,
            t1.ShortName AS Team1Short,
            t2.TeamName  AS Team2Name,
            t2.ShortName AS Team2Short,
            tw.ShortName AS WinnerShort,
            p.Nickname   AS MVPNickname
        FROM Matches m
        JOIN Teams   t1 ON t1.TeamID  = m.Team1ID
        JOIN Teams   t2 ON t2.TeamID  = m.Team2ID
        LEFT JOIN Teams   tw ON tw.TeamID  = m.WinnerTeamID
        LEFT JOIN Players p  ON p.PlayerID = m.MVPPlayerID
        WHERE m.MatchID = @mid
      `);

    if (!sqlResult.recordset.length) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu." });
    }

    const match = sqlResult.recordset[0];

    let mongoStats = null;
    if (match.MongoMatchRef) {
      try {
        const mongoDb = getMongoDb();
        mongoStats = await mongoDb.collection("match_stats").findOne({
          $or: [
            { match_id: matchId },
            { _id: new ObjectId(match.MongoMatchRef) },
          ],
        });
      } catch {
        /* MongoDB optional */
      }
    } else {
      // Thử lấy MongoDB theo match_id dù không có MongoMatchRef
      try {
        const mongoDb = getMongoDb();
        mongoStats = await mongoDb
          .collection("match_stats")
          .findOne({ match_id: matchId });
      } catch {
        /* optional */
      }
    }

    res.json({ data: { ...match, mongoStats } });
  } catch (err) {
    console.error("getMatchDetail:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết trận đấu." });
  }
};
