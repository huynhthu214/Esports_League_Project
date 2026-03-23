// backend/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/players/:id/form", analyticsController.getPlayerForm);
router.get("/h2h", analyticsController.getTeamH2H);
router.get("/reports/season/:id", analyticsController.getSeasonReport);
// router.get("/meta-heroes", analyticsController.getMetaHeroes);

module.exports = router;
