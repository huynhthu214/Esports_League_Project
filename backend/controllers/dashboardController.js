// backend/controllers/dashboardController.js
// GET /api/admin/dashboard?seasonId=SS2025
// Trả về số liệu tổng quan mùa hiện tại cho Admin Dashboard

const { getPool, sql } = require("../config/db");

const getDashboardStats = async (req, res) => {
  const { seasonId } = req.query;
  if (!seasonId) return res.status(400).json({ message: "Thiếu seasonId." });

  try {
    const pool = getPool();

    // 1. Thông tin mùa giải
    const seasonRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query(`SELECT SeasonID, SeasonName, StartDate, EndDate, Status, Format, MaxTeams
              FROM Seasons WHERE SeasonID = @sid`);

    // 2. Số đội, tuyển thủ, trận đấu, chuyển nhượng
    const countsRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId).query(`
        SELECT
          (SELECT COUNT(DISTINCT TeamID) FROM SeasonTeams WHERE SeasonID = @sid AND Status = 'ACTIVE') AS TotalTeams,
          (SELECT COUNT(DISTINCT PlayerID) FROM Rosters WHERE SeasonID = @sid AND Status = 'ACTIVE')  AS TotalPlayers,
          (SELECT COUNT(*) FROM Matches WHERE SeasonID = @sid)                                         AS TotalMatches,
          (SELECT COUNT(*) FROM TransferHistory WHERE SeasonID = @sid)                                 AS TotalTransfers
      `);

    // 3. Top 3 đội (theo vw_TeamStandings)
    const topTeamsRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query(`SELECT TOP 3 Standing_Rank, TeamName, ShortName, Wins, Losses, Points, WinRate
              FROM vw_TeamStandings WHERE SeasonID = @sid ORDER BY Standing_Rank`);

    // 4. Top 5 tuyển thủ KDA (theo vw_Leaderboard_KDA)
    const topPlayersRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query(`SELECT TOP 5 KDA_Rank, Nickname, Position, TeamShort, AvgKDA, AvgGPM, WinRate
              FROM vw_Leaderboard_KDA WHERE SeasonID = @sid ORDER BY KDA_Rank`);

    // 5. 5 trận gần nhất
    const recentMatchesRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId).query(`SELECT TOP 5
                m.MatchID, m.MatchDate,
                t1.ShortName AS Team1, t2.ShortName AS Team2,
                m.Team1Score, m.Team2Score,
                tw.ShortName AS Winner
              FROM Matches m
              JOIN Teams t1 ON t1.TeamID = m.Team1ID
              JOIN Teams t2 ON t2.TeamID = m.Team2ID
              LEFT JOIN Teams tw ON tw.TeamID = m.WinnerTeamID
              WHERE m.SeasonID = @sid
              ORDER BY m.MatchDate DESC`);

    // 6. Dữ liệu export đầy đủ cho Excel (tất cả tuyển thủ + tất cả đội)
    const allPlayersRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query(`SELECT KDA_Rank, Nickname, Position, TeamName, TeamShort,
                     TotalMatches, TotalKills, TotalDeaths, TotalAssists,
                     AvgKDA, AvgGPM, WinRate
              FROM vw_Leaderboard_KDA WHERE SeasonID = @sid ORDER BY KDA_Rank`);

    const allTeamsRes = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query(`SELECT Standing_Rank, TeamName, ShortName, Wins, Losses,
                     TotalMatches, Points, WinRate, GoalDiff
              FROM vw_TeamStandings WHERE SeasonID = @sid ORDER BY Standing_Rank`);

    res.json({
      season: seasonRes.recordset[0] || null,
      counts: countsRes.recordset[0] || {},
      topTeams: topTeamsRes.recordset,
      topPlayers: topPlayersRes.recordset,
      recentMatches: recentMatchesRes.recordset,
      exportData: {
        players: allPlayersRes.recordset,
        teams: allTeamsRes.recordset,
      },
    });
  } catch (err) {
    console.error("getDashboardStats:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy dashboard stats." });
  }
};

module.exports = { getDashboardStats };
