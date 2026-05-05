const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const matchController = require("../controllers/matchController");
const { getDashboardStats } = require("../controllers/dashboardController");
const {
  getSeasons,
  getTeams,
  getPlayers,
  getAllPlayers,
  getNextPlayerId,
  createPlayer,
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
  getSeasonTeams,
  registerSeasonTeams,
  getAvailablePlayers,
  getPlayerRosterContext,
  getRosterPlayersBySeason,
} = require("../controllers/adminController");

// ── PUBLIC
router.get("/seasons", getSeasons);
router.get("/teams", getTeams);
router.get("/players/available", getAvailablePlayers); // ← PHẢI ĐẶT TRƯỚC /:id
router.get("/players", getPlayers);
router.get("/players/:id/profile", getPlayerProfile);
router.get("/leaderboards/players", getPlayerLeaderboard);
router.get("/leaderboards/teams", getTeamStandings);
router.get("/rosters/:teamId", getTeamRoster);
router.get("/transfers", getTransferHistory);
router.get("/season-teams", getSeasonTeams);
router.get("/dashboard", getDashboardStats);
router.get("/matches/schedule", matchController.getMatchSchedule);
router.get("/matches/history", matchController.getMatchHistory);
router.get("/matches/:matchId/detail", matchController.getMatchDetail);

// ── ADMIN ONLY
router.post("/seasons", verifyToken, requireAdmin, createSeason);
router.post("/season-teams", verifyToken, requireAdmin, registerSeasonTeams);
router.post("/rosters", verifyToken, requireAdmin, registerRoster);
router.post("/transfers", verifyToken, requireAdmin, transferPlayer);
router.get("/players/all", verifyToken, requireAdmin, getAllPlayers);
router.get("/players/next-id", verifyToken, requireAdmin, getNextPlayerId);
router.post("/players", verifyToken, requireAdmin, createPlayer);
router.get(
  "/rosters/players",
  verifyToken,
  requireAdmin,
  getRosterPlayersBySeason,
);
router.get(
  "/rosters/player/:playerId",
  verifyToken,
  requireAdmin,
  getPlayerRosterContext,
);
router.post(
  "/matches",
  verifyToken,
  requireAdmin,
  matchController.submitMatchResult,
);
router.patch("/rosters/remove", verifyToken, requireAdmin, removeFromRoster);
router.patch(
  "/players/:id/deactivate",
  verifyToken,
  requireAdmin,
  deactivatePlayer,
);
router.patch(
  "/players/:id/activate",
  verifyToken,
  requireAdmin,
  activatePlayer,
);

module.exports = router;
