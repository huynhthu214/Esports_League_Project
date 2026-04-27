const { sql, getPool, getMongoDb } = require('../config/db');

// POST /api/matches
// Nhận dữ liệu từ MatchResultForm mới, đồng bộ vào MongoDB + SQL (Dual-Write)
exports.submitMatchResult = async (req, res) => {
    const matchData = req.body;

    // Validate cơ bản
    if (!matchData.match_id || !matchData.season_id || !Array.isArray(matchData.teams) || matchData.teams.length < 2) {
        return res.status(400).json({ error: 'Dữ liệu trận đấu không hợp lệ. Cần có match_id, season_id và 2 đội.' });
    }

    const mongoDb = getMongoDb();
    const pool = getPool();
    const transaction = pool.transaction();
    let mongoInsertedId = null;

    try {
        const winningTeam = matchData.teams.find(t => t.result === 'WIN')?.team_id;
        const losingTeam = matchData.teams.find(t => t.result === 'LOSS')?.team_id;

        if (!winningTeam || !losingTeam) {
            throw new Error('Dữ liệu JSON không hợp lệ: Thiếu team WIN/LOSS.');
        }

        // ==========================================
        // BƯỚC 1: LƯU VÀO MONGODB (NoSQL) TRƯỚC
        // ==========================================
        const mongoDoc = {
            match_id: matchData.match_id,
            season_id: matchData.season_id,
            match_date: matchData.match_date ? new Date(matchData.match_date) : new Date(),
            venue: matchData.venue || null,
            format: matchData.format || 'BO3',
            teams: matchData.teams,
            created_at: new Date()
        };

        const insertResult = await mongoDb.collection('match_stats').insertOne(mongoDoc);
        mongoInsertedId = insertResult.insertedId;

        // ==========================================
        // BƯỚC 2: CẬP NHẬT MS SQL BẰNG TRANSACTION
        // ==========================================
        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input('MatchID', sql.VarChar(20), matchData.match_id);
        request.input('SeasonID', sql.VarChar(10), matchData.season_id);
        request.input('Team1ID', sql.VarChar(10), matchData.team1_id || matchData.teams[0]?.team_id);
        request.input('Team2ID', sql.VarChar(10), matchData.team2_id || matchData.teams[1]?.team_id);
        request.input('WinnerTeamID', sql.VarChar(10), winningTeam);
        request.input('Team1Score', sql.Int, parseInt(matchData.team1_score) || 0);
        request.input('Team2Score', sql.Int, parseInt(matchData.team2_score) || 0);
        request.input('MatchDate', sql.DateTime, matchData.match_date ? new Date(matchData.match_date) : new Date());
        request.input('Venue', sql.NVarChar(100), matchData.venue || null);
        request.input('Format', sql.VarChar(10), matchData.format || 'BO3');
        request.input('MongoRef', sql.VarChar(50), mongoInsertedId.toString());
        request.input('WinTeam', sql.VarChar(10), winningTeam);
        request.input('LoseTeam', sql.VarChar(10), losingTeam);

        // Upsert vào bảng Matches (nếu match_id đã tồn tại thì skip)
        await request.query(`
            IF NOT EXISTS (SELECT 1 FROM Matches WHERE MatchID = @MatchID)
            BEGIN
                INSERT INTO Matches (MatchID, SeasonID, Team1ID, Team2ID, WinnerTeamID, Team1Score, Team2Score, MatchDate, Venue, Format, MongoMatchRef)
                VALUES (@MatchID, @SeasonID, @Team1ID, @Team2ID, @WinnerTeamID, @Team1Score, @Team2Score, @MatchDate, @Venue, @Format, @MongoRef)
            END
        `);

        // Upsert TeamStandings — đội thắng
        await request.query(`
            IF EXISTS (SELECT 1 FROM TeamStandings WHERE TeamID = @WinTeam AND SeasonID = @SeasonID)
                UPDATE TeamStandings
                SET Wins = Wins + 1,
                    WinRate = CAST((Wins + 1) AS FLOAT) / NULLIF((Wins + 1 + Losses), 0) * 100,
                    LastUpdated = GETDATE()
                WHERE TeamID = @WinTeam AND SeasonID = @SeasonID
            ELSE
                INSERT INTO TeamStandings (SeasonID, TeamID, Wins, Losses, WinRate)
                VALUES (@SeasonID, @WinTeam, 1, 0, 100.00)
        `);

        // Upsert TeamStandings — đội thua
        await request.query(`
            IF EXISTS (SELECT 1 FROM TeamStandings WHERE TeamID = @LoseTeam AND SeasonID = @SeasonID)
                UPDATE TeamStandings
                SET Losses = Losses + 1,
                    WinRate = CAST(Wins AS FLOAT) / NULLIF((Wins + Losses + 1), 0) * 100,
                    LastUpdated = GETDATE()
                WHERE TeamID = @LoseTeam AND SeasonID = @SeasonID
            ELSE
                INSERT INTO TeamStandings (SeasonID, TeamID, Wins, Losses, WinRate)
                VALUES (@SeasonID, @LoseTeam, 0, 1, 0.00)
        `);

        // NẾU TẤT CẢ THÀNH CÔNG → CHỐT GIAO DỊCH SQL
        await transaction.commit();

        res.status(200).json({
            message: `✅ Đồng bộ thành công! Trận ${matchData.match_id}: ${winningTeam} thắng ${losingTeam}`,
            match_id: matchData.match_id,
            mongo_id: mongoInsertedId.toString()
        });

    } catch (error) {
        console.error('❌ Lỗi Dual-write:', error);

        // Hoàn tác SQL nếu đang chạy dở
        try {
            if (transaction._activeRequest) {
                await transaction.rollback();
                console.log('🔄 Đã Rollback MS SQL.');
            }
        } catch (_) {}

        // Xóa document MongoDB vừa tạo để đồng bộ (Compensating Transaction)
        if (mongoInsertedId) {
            try {
                await mongoDb.collection('match_stats').deleteOne({ _id: mongoInsertedId });
                console.log('🗑️ Đã xóa log bên MongoDB do SQL thất bại.');
            } catch (_) {}
        }

        res.status(500).json({ error: error.message || 'Lỗi hệ thống, đã rollback toàn bộ giao dịch.' });
    }
};

// GET /api/matches?seasonId=SS2025&teamId=SGD
// Lấy lịch sử trận đấu (đã có kết quả)
exports.getMatchHistory = async (req, res) => {
    try {
        const { seasonId, teamId } = req.query;
        const pool = getPool();
        const request = pool.request();

        let where = 'WHERE m.WinnerTeamID IS NOT NULL';
        if (seasonId) {
            request.input('SeasonID', sql.VarChar(10), seasonId);
            where += ' AND m.SeasonID = @SeasonID';
        }
        if (teamId) {
            request.input('TeamID', sql.VarChar(10), teamId);
            where += ' AND (m.Team1ID = @TeamID OR m.Team2ID = @TeamID)';
        }

        const result = await request.query(`
            SELECT
                m.MatchID, m.SeasonID, s.SeasonName,
                m.Team1ID, t1.TeamName AS Team1Name, t1.ShortName AS Team1Short,
                m.Team2ID, t2.TeamName AS Team2Name, t2.ShortName AS Team2Short,
                m.WinnerTeamID, tw.TeamName AS WinnerName,
                m.Team1Score, m.Team2Score,
                m.MatchDate, m.Venue, m.Format, m.DurationMinutes,
                m.MongoMatchRef
            FROM Matches m
            JOIN Seasons s ON s.SeasonID = m.SeasonID
            JOIN Teams t1 ON t1.TeamID = m.Team1ID
            JOIN Teams t2 ON t2.TeamID = m.Team2ID
            LEFT JOIN Teams tw ON tw.TeamID = m.WinnerTeamID
            ${where}
            ORDER BY m.MatchDate DESC
        `);

        res.json({ data: result.recordset });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/matches/schedule?seasonId=SS2025
// Lịch thi đấu (bao gồm cả chưa có kết quả)
exports.getMatchSchedule = async (req, res) => {
    try {
        const { seasonId } = req.query;
        const pool = getPool();
        const request = pool.request();

        let where = 'WHERE 1=1';
        if (seasonId) {
            request.input('SeasonID', sql.VarChar(10), seasonId);
            where += ' AND m.SeasonID = @SeasonID';
        }

        const result = await request.query(`
            SELECT
                m.MatchID, m.SeasonID, s.SeasonName,
                m.Team1ID, t1.TeamName AS Team1Name, t1.ShortName AS Team1Short,
                m.Team2ID, t2.TeamName AS Team2Name, t2.ShortName AS Team2Short,
                m.WinnerTeamID,
                m.Team1Score, m.Team2Score,
                m.MatchDate, m.Venue, m.Format,
                CASE WHEN m.WinnerTeamID IS NULL THEN 'UPCOMING' ELSE 'COMPLETED' END AS MatchStatus
            FROM Matches m
            JOIN Seasons s ON s.SeasonID = m.SeasonID
            JOIN Teams t1 ON t1.TeamID = m.Team1ID
            JOIN Teams t2 ON t2.TeamID = m.Team2ID
            ${where}
            ORDER BY m.MatchDate ASC
        `);

        res.json({ data: result.recordset });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/matches/:matchId/detail
// Chi tiết trận đấu từ MongoDB
exports.getMatchDetail = async (req, res) => {
    try {
        const { matchId } = req.params;
        const mongoDb = getMongoDb();

        const match = await mongoDb.collection('match_stats').findOne({ match_id: matchId });
        if (!match) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu chi tiết trận đấu.' });
        }

        res.json({ data: match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// =============================================================
// THÊM VÀO matchController.js — các route còn thiếu
// Paste các hàm này vào cuối file matchController.js gốc
// =============================================================

const { getPlayerForm } = require("../../databases/nosql_database/aggregation_player_form");

// ─────────────────────────────────────────────────────────────
// GET /api/matches/player/:playerId/form
// Lấy chỉ số form tuyển thủ (50 trận gần nhất) cho analyst dashboard
// Trả về: avg_kda, avg_gpm, win_rate, kda_distribution (bucket)
// ─────────────────────────────────────────────────────────────
exports.getPlayerFormStats = async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({ error: "Thiếu playerId." });
    }

    const result = await getPlayerForm(playerId);

    if (!result.form) {
      return res.status(404).json({
        message: `Không tìm thấy dữ liệu cho player ${playerId}.`,
      });
    }

    res.json({ data: result });
  } catch (error) {
    console.error("❌ Lỗi getPlayerFormStats:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/matches/player/:playerId/form/compare?rivals=P002,P003
// So sánh form của nhiều tuyển thủ cùng lúc (cho ComparePlayers.jsx)
// ─────────────────────────────────────────────────────────────
exports.comparePlayerForms = async (req, res) => {
  try {
    const { playerId } = req.params;
    const rivals = req.query.rivals
      ? req.query.rivals.split(",").map((id) => id.trim())
      : [];

    const allPlayerIds = [playerId, ...rivals].filter(Boolean);

    if (allPlayerIds.length === 0) {
      return res.status(400).json({ error: "Cần ít nhất 1 playerId." });
    }

    // Chạy song song các pipeline
    const results = await Promise.all(
      allPlayerIds.map((pid) => getPlayerForm(pid))
    );

    res.json({
      data: results.filter((r) => r.form !== null),
    });
  } catch (error) {
    console.error("❌ Lỗi comparePlayerForms:", error);
    res.status(500).json({ error: error.message });
  }
};
