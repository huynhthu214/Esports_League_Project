const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/players/:id/form", analyticsController.getPlayerForm);
router.get("/compare", analyticsController.comparePlayers);
router.get("/h2h", analyticsController.getTeamH2H);
router.get("/meta-heroes", analyticsController.getMetaHeroes);
router.get("/reports/season/:id", analyticsController.getSeasonReport);
router.get("/predict", analyticsController.predictMatch);

module.exports = router;
