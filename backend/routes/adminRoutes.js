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
} = require("../controllers/adminController");

// ── PUBLIC (không cần đăng nhập) 
// Dropdown data
router.get("/seasons", getSeasons);
router.get("/teams", getTeams);
router.get("/players", getPlayers);

// Leaderboards — fan cũng xem được
router.get("/leaderboards/players", getPlayerLeaderboard);
router.get("/leaderboards/teams", getTeamStandings);

// Xem roster đội
router.get("/rosters/:teamId", getTeamRoster);

// Lịch sử chuyển nhượng
router.get("/transfers", getTransferHistory);

// ── ADMIN ONLY
router.post("/seasons", verifyToken, requireAdmin, createSeason);
router.post("/rosters", verifyToken, requireAdmin, registerRoster);
router.post("/transfers", verifyToken, requireAdmin, transferPlayer);
router.patch("/rosters/remove", verifyToken, requireAdmin, removeFromRoster);

router.post('/matches', matchController.submitMatchResult);

module.exports = router;
