// controllers/adminController.js - (THÚY VI)
// ================================================================
// Schema thực tế (01_CREATE_TABLES.sql):
//   Seasons      : SeasonID varchar(10), SeasonName, StartDate, EndDate, MaxTeams, Format, Status
//   Teams        : TeamID varchar(10) = ShortName (SGD/HNL/FLC...), TeamName, ShortName, IsActive
//   Players      : PlayerID varchar(10), Nickname, FullName, Position, IsActive
//   SeasonTeams  : SeasonID, TeamID, Status
//   Rosters      : PlayerID, TeamID, SeasonID, JoinDate, LeaveDate, Status
//   Matches      : MatchID, SeasonID, Team1ID, Team2ID, WinnerTeamID, Team1Score, Team2Score...
//   TeamStandings: SeasonID, TeamID, Wins, Losses, Points, WinRate, GoalDiff
//   PlayerSeasonStats: PlayerID, SeasonID, TeamID, TotalMatches, AvgKDA, AvgGPM, WinRate...
//   TransferHistory: TransferID(identity), PlayerID, FromTeamID, ToTeamID, SeasonID, TransferFee...
//
// Stored Procedures có sẵn (04_PROCEDURES.sql):
//   sp_TransferPlayer(@PlayerID, @FromTeamID, @ToTeamID, @SeasonID, @TransferFee, @Reason, @ApprovedBy)
//   sp_RegisterTeamToSeason(@TeamID, @SeasonID, @PlayerList JSON)
//   sp_GetTeamRoster(@TeamID, @SeasonID)
//
// Views có sẵn (05_VIEWS.sql):
//   vw_Leaderboard_KDA     — DENSE_RANK theo AvgKDA, có cột SeasonID, Position, Position_Rank, GPM_Rank
//   vw_TeamStandings       — DENSE_RANK theo Wins/WinRate/GoalDiff, có cột SeasonID
//   vw_PlayerSeasonSummary — tổng hợp tuyển thủ kèm MVPCount, SeasonKDA_Rank
// ================================================================

const { getPool, sql } = require("../config/db");

// ================================================================
// HELPERS — dropdown data cho Frontend
// ================================================================

// GET /api/seasons
const getSeasons = async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        `SELECT SeasonID, SeasonName, StartDate, EndDate, Status, Format, MaxTeams
       FROM Seasons ORDER BY StartDate DESC`,
      );
    res.json({ data: result.recordset });
  } catch (err) {
    console.error("getSeasons:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mùa giải." });
  }
};

// GET /api/teams
const getTeams = async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        `SELECT TeamID, TeamName, ShortName, Region
       FROM Teams WHERE IsActive = 1 ORDER BY TeamName`,
      );
    res.json({ data: result.recordset });
  } catch (err) {
    console.error("getTeams:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đội." });
  }
};

// GET /api/players
const getPlayers = async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        `SELECT PlayerID, Nickname, FullName, Position
       FROM Players WHERE IsActive = 1 ORDER BY Nickname`,
      );
    res.json({ data: result.recordset });
  } catch (err) {
    console.error("getPlayers:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy danh sách tuyển thủ." });
  }
};

// ================================================================
// TẠO MÙA GIẢI
// POST /api/seasons
// Body: { seasonId, seasonName, startDate, endDate, maxTeams?, format? }
// ================================================================
const createSeason = async (req, res) => {
  const {
    seasonId,
    seasonName,
    startDate,
    endDate,
    maxTeams = 12,
    format = "BO3",
  } = req.body;

  if (!seasonId || !seasonName || !startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Thiếu: seasonId, seasonName, startDate, endDate." });
  }
  if (!["BO1", "BO3", "BO5"].includes(format)) {
    return res
      .status(400)
      .json({ message: "Format phải là BO1, BO3 hoặc BO5." });
  }

  try {
    const pool = getPool();

    const existing = await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .query("SELECT SeasonID FROM Seasons WHERE SeasonID = @sid");

    if (existing.recordset.length > 0) {
      return res
        .status(409)
        .json({ message: `SeasonID "${seasonId}" đã tồn tại.` });
    }

    await pool
      .request()
      .input("sid", sql.VarChar(10), seasonId)
      .input("sname", sql.NVarChar(100), seasonName)
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("maxTeams", sql.Int, maxTeams)
      .input("format", sql.NVarChar(50), format).query(`
        INSERT INTO Seasons (SeasonID, SeasonName, StartDate, EndDate, MaxTeams, Format, Status)
        VALUES (@sid, @sname, @startDate, @endDate, @maxTeams, @format, 'UPCOMING')
      `);

    res
      .status(201)
      .json({ message: `Tạo mùa giải "${seasonName}" thành công.`, seasonId });
  } catch (err) {
    console.error("createSeason:", err.message);
    res.status(500).json({ message: "Lỗi server khi tạo mùa giải." });
  }
};

// ================================================================
// ĐĂNG KÝ ROSTER — gọi sp_RegisterTeamToSeason
// POST /api/rosters
// Body: { teamId, seasonId, playerIds: ["P001","P002",...] }
//
// SP tự xử lý:
//   - kiểm tra season tồn tại và còn UPCOMING/ACTIVE
//   - kiểm tra team active
//   - kiểm tra MaxTeams chưa đủ
//   - INSERT SeasonTeams (nếu chưa có)
//   - INSERT Rosters từng player (OPENJSON)
// Trigger trg_PreventDuplicateRoster + trg_CheckRosterLimit + trg_ValidateRosterTeamInSeason
// sẽ tự động kiểm tra thêm sau INSERT
// ================================================================
const registerRoster = async (req, res) => {
  const { teamId, seasonId, playerIds } = req.body;

  if (
    !teamId ||
    !seasonId ||
    !Array.isArray(playerIds) ||
    playerIds.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Thiếu: teamId, seasonId, playerIds[]." });
  }
  if (playerIds.length < 5 || playerIds.length > 10) {
    return res.status(400).json({ message: "Số tuyển thủ phải từ 5 đến 10." });
  }

  try {
    const pool = getPool();
    const playerListJson = JSON.stringify(playerIds); // '["P001","P002",...]'

    const result = await pool
      .request()
      .input("TeamID", sql.VarChar(10), teamId)
      .input("SeasonID", sql.VarChar(10), seasonId)
      .input("PlayerList", sql.NVarChar(sql.MAX), playerListJson)
      .execute("sp_RegisterTeamToSeason");

    const row = result.recordset?.[0];
    res.status(201).json({
      message: row?.TrangThai || "Đăng ký roster thành công.",
      data: row,
    });
  } catch (err) {
    console.error("registerRoster:", err.message);
    // Trigger message có prefix "❌ VI PHẠM:" hoặc "❌"
    if (err.message?.includes("VI PHẠM") || err.message?.includes("❌")) {
      return res
        .status(409)
        .json({ message: err.message, type: "TRIGGER_VIOLATION" });
    }
    res
      .status(500)
      .json({ message: err.message || "Lỗi server khi đăng ký roster." });
  }
};

// ================================================================
// CHUYỂN NHƯỢNG — gọi sp_TransferPlayer
// POST /api/transfers
// Body: { playerId, fromTeamId, toTeamId, seasonId, transferFee?, reason?, approvedBy? }
//
// SP đã có sẵn:
//   SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
//   UPDLOCK + HOLDLOCK tránh race condition khi check slot đội mới
//   7 bước: validate → check đội cũ ACTIVE → check slot đội mới (<10)
//           → check đội mới đăng ký mùa → UPDATE TRANSFERRED_OUT
//           → INSERT roster mới → INSERT TransferHistory → COMMIT
//   Nếu lỗi → ROLLBACK tự động trong CATCH của SP
// ================================================================
const transferPlayer = async (req, res) => {
  const {
    playerId,
    fromTeamId,
    toTeamId,
    seasonId,
    transferFee = 0,
    reason = null,
    approvedBy = null,
  } = req.body;

  if (!playerId || !fromTeamId || !toTeamId || !seasonId) {
    return res
      .status(400)
      .json({ message: "Thiếu: playerId, fromTeamId, toTeamId, seasonId." });
  }

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("PlayerID", sql.VarChar(10), playerId)
      .input("FromTeamID", sql.VarChar(10), fromTeamId)
      .input("ToTeamID", sql.VarChar(10), toTeamId)
      .input("SeasonID", sql.VarChar(10), seasonId)
      .input("TransferFee", sql.Decimal(15, 2), transferFee)
      .input("Reason", sql.NVarChar(200), reason)
      .input("ApprovedBy", sql.NVarChar(100), approvedBy)
      .execute("sp_TransferPlayer");

    const row = result.recordset?.[0];
    res.status(200).json({
      type: "COMMIT",
      message: `Chuyển nhượng thành công. ${row?.TuyenThu}: ${row?.DoiCu} → ${row?.DoiMoi}`,
      data: row,
    });
  } catch (err) {
    // SP đã ROLLBACK bên trong, đây là lỗi được ném ra sau rollback
    console.error("transferPlayer ROLLBACK:", err.message);
    res.status(500).json({
      type: "ROLLBACK",
      message:
        err.message || "Chuyển nhượng thất bại. Transaction đã ROLLBACK.",
    });
  }
};

// ================================================================
// LEADERBOARD TUYỂN THỦ — dùng vw_Leaderboard_KDA
// GET /api/leaderboards/players?seasonId=SS2025&position=Jungle&limit=20
// View đã tính: DENSE_RANK, KDA_Rank, Position_Rank, GPM_Rank, WinRate_Rank
// Chỉ hiện player có TotalMatches >= 5 (lọc trong view)
// ================================================================
const getPlayerLeaderboard = async (req, res) => {
  const { seasonId, position, limit = 20 } = req.query;

  if (!seasonId) {
    return res.status(400).json({ message: "Vui lòng truyền seasonId." });
  }

  try {
    const pool = getPool();
    const request = pool.request().input("seasonId", sql.VarChar(10), seasonId);
    const safeLimit = Math.min(parseInt(limit) || 20, 100);

    let extraWhere = "";
    if (position) {
      request.input("position", sql.VarChar(20), position);
      extraWhere = "AND Position = @position";
    }

    const result = await request.query(`
      SELECT TOP (${safeLimit})
        KDA_Rank, PlayerID, Nickname, Position,
        TeamName, TeamShort, SeasonName, SeasonID,
        TotalMatches, TotalKills, TotalDeaths, TotalAssists,
        AvgKDA, AvgGPM, WinRate,
        Position_Rank, GPM_Rank, WinRate_Rank
      FROM vw_Leaderboard_KDA
      WHERE SeasonID = @seasonId ${extraWhere}
      ORDER BY KDA_Rank
    `);

    res.json({ data: result.recordset, seasonId });
  } catch (err) {
    console.error("getPlayerLeaderboard:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy leaderboard tuyển thủ." });
  }
};

// ================================================================
// BẢNG XẾP HẠNG ĐỘI — dùng vw_TeamStandings
// GET /api/leaderboards/teams?seasonId=SS2025
// View đã tính: DENSE_RANK theo Wins DESC, WinRate DESC, GoalDiff DESC
// ================================================================
const getTeamStandings = async (req, res) => {
  const { seasonId } = req.query;

  if (!seasonId) {
    return res.status(400).json({ message: "Vui lòng truyền seasonId." });
  }

  try {
    const result = await getPool()
      .request()
      .input("seasonId", sql.VarChar(10), seasonId).query(`
        SELECT
          Standing_Rank, TeamID, TeamName, ShortName,
          SeasonID, SeasonName, SeasonStatus,
          Wins, Losses, TotalMatches,
          Points, WinRate, GoalDiff, AvgPointsPerMatch, LastUpdated
        FROM vw_TeamStandings
        WHERE SeasonID = @seasonId
        ORDER BY Standing_Rank
      `);

    res.json({ data: result.recordset, seasonId });
  } catch (err) {
    console.error("getTeamStandings:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy bảng xếp hạng đội." });
  }
};

// ================================================================
// ROSTER CỦA ĐỘI — gọi sp_GetTeamRoster
// GET /api/rosters/:teamId?seasonId=SS2025
// SP trả về: PlayerID, Nickname, Position, JoinDate, Status, AvgKDA, AvgGPM, WinRate, TotalMatches
// Được sắp xếp theo thứ tự vị trí: Top → Jungle → Mid → ADC → Support
// ================================================================
const getTeamRoster = async (req, res) => {
  const { teamId } = req.params;
  const { seasonId } = req.query;

  if (!teamId || !seasonId) {
    return res.status(400).json({ message: "Thiếu teamId hoặc seasonId." });
  }

  try {
    const result = await getPool()
      .request()
      .input("TeamID", sql.VarChar(10), teamId)
      .input("SeasonID", sql.VarChar(10), seasonId)
      .execute("sp_GetTeamRoster");

    res.json({ data: result.recordset, teamId, seasonId });
  } catch (err) {
    console.error("getTeamRoster:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy roster." });
  }
};

// ================================================================
// LỊCH SỬ CHUYỂN NHƯỢNG
// GET /api/transfers?playerId=P003&seasonId=SS2025
// ================================================================
const getTransferHistory = async (req, res) => {
  const { playerId, seasonId } = req.query;

  try {
    const pool = getPool();
    const request = pool.request();
    let where = "WHERE 1=1";

    if (playerId) {
      request.input("playerId", sql.VarChar(10), playerId);
      where += " AND th.PlayerID = @playerId";
    }
    if (seasonId) {
      request.input("seasonId", sql.VarChar(10), seasonId);
      where += " AND th.SeasonID = @seasonId";
    }

    const result = await request.query(`
      SELECT
        th.TransferID, th.TransferDate, th.TransferFee, th.Reason, th.ApprovedBy,
        p.Nickname   AS PlayerNickname,  p.Position,
        ft.TeamName  AS FromTeamName,    ft.ShortName AS FromShort,
        tt.TeamName  AS ToTeamName,      tt.ShortName AS ToShort,
        s.SeasonName
      FROM TransferHistory th
      JOIN Players p  ON p.PlayerID  = th.PlayerID
      JOIN Teams   ft ON ft.TeamID   = th.FromTeamID
      JOIN Teams   tt ON tt.TeamID   = th.ToTeamID
      JOIN Seasons s  ON s.SeasonID  = th.SeasonID
      ${where}
      ORDER BY th.TransferDate DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error("getTransferHistory:", err.message);
    res.status(500).json({ message: "Lỗi khi lấy lịch sử chuyển nhượng." });
  }
};

// Thêm vào backend/controllers/adminController.js
// PATCH /api/rosters/remove
// Body: { playerId, teamId, seasonId }
// Chuyển status → TRANSFERRED_OUT (không xóa cứng để giữ lịch sử)

const removeFromRoster = async (req, res) => {
  const { playerId, teamId, seasonId } = req.body;

  if (!playerId || !teamId || !seasonId) {
    return res
      .status(400)
      .json({ message: "Thiếu playerId, teamId hoặc seasonId." });
  }

  try {
    const pool = getPool();

    // Kiểm tra player có đang ACTIVE trong đội này không
    const check = await pool
      .request()
      .input("pid", sql.VarChar(10), playerId)
      .input("tid", sql.VarChar(10), teamId)
      .input("sid", sql.VarChar(10), seasonId).query(`
        SELECT RosterID FROM Rosters
        WHERE PlayerID = @pid AND TeamID = @tid AND SeasonID = @sid AND Status = 'ACTIVE'
      `);

    if (check.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Tuyển thủ không thuộc đội này hoặc không ACTIVE." });
    }

    // Cập nhật status → TRANSFERRED_OUT
    await pool
      .request()
      .input("pid", sql.VarChar(10), playerId)
      .input("tid", sql.VarChar(10), teamId)
      .input("sid", sql.VarChar(10), seasonId).query(`
        UPDATE Rosters
        SET Status = 'TRANSFERRED_OUT', LeaveDate = CAST(GETDATE() AS DATE)
        WHERE PlayerID = @pid AND TeamID = @tid AND SeasonID = @sid AND Status = 'ACTIVE'
      `);

    res.json({ message: "Đã xóa tuyển thủ khỏi đội thành công." });
  } catch (err) {
    console.error("removeFromRoster:", err.message);
    res.status(500).json({ message: "Lỗi server khi xóa thành viên." });
  }
};

module.exports = {
  getSeasons,
  getTeams,
  getPlayers,
  createSeason,
  registerRoster,
  transferPlayer,
  removeFromRoster,
  getTeamRoster,
  getTransferHistory,
  getPlayerLeaderboard,
  getTeamStandings,
};
