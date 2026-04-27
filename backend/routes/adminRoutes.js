// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const matchController = require('../controllers/matchController');
const {
  getSeasons,
  getTeams,
  getPlayers,
  createSeason,
  registerRoster,
  getTeamRoster,
  transferPlayer,
  removeFromRoster,
  getTransferHistory,
  getPlayerLeaderboard,
  getTeamStandings,
  deactivatePlayer,
  activatePlayer,
  getPlayerProfile,
} = require("../controllers/adminController");

// ── PUBLIC (không cần đăng nhập)
// Dropdown data
router.get("/seasons", getSeasons);
router.get("/teams", getTeams);
router.get("/players", getPlayers);
router.get("/players/:id/profile", getPlayerProfile);

// Leaderboards — fan cũng xem được
router.get("/leaderboards/players", getPlayerLeaderboard);
router.get("/leaderboards/teams", getTeamStandings);

// Xem roster đội
router.get("/rosters/:teamId", getTeamRoster);

// Lịch sử chuyển nhượng (public)
router.get("/transfers", getTransferHistory);

// Lịch thi đấu & lịch sử (public)
router.get("/matches/schedule", matchController.getMatchSchedule);
router.get("/matches/history", matchController.getMatchHistory);
router.get("/matches/:matchId/detail", matchController.getMatchDetail);

// ── ADMIN ONLY
router.post("/seasons", verifyToken, requireAdmin, createSeason);
router.post("/rosters", verifyToken, requireAdmin, registerRoster);
router.post("/transfers", verifyToken, requireAdmin, transferPlayer);
router.patch("/rosters/remove", verifyToken, requireAdmin, removeFromRoster);
router.patch("/players/:id/deactivate", verifyToken, requireAdmin, deactivatePlayer);
router.patch("/players/:id/activate", verifyToken, requireAdmin, activatePlayer);

// Nhập kết quả trận đấu (chỉ Admin)
router.post('/matches', verifyToken, requireAdmin, matchController.submitMatchResult);

module.exports = router;
