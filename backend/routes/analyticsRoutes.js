// backend/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Phân tích phong độ 50 trận của tuyển thủ
router.get("/players/:id/form", analyticsController.getPlayerForm);

// Lịch sử đối đầu 2 đội
router.get("/h2h", analyticsController.getTeamH2H);

// Báo cáo tổng quan mùa giải — JSON
router.get("/reports/season/:id", analyticsController.getSeasonReport);

// Xuất PDF báo cáo mùa giải
router.get("/reports/season/:id/pdf", analyticsController.getSeasonReportPDF);

// Meta tướng hot
router.get("/meta-heroes", analyticsController.getMetaHeroes);

// So sánh 2 tuyển thủ
router.get("/compare", analyticsController.comparePlayers);

// Dự đoán kết quả trận đấu
router.get("/predict", analyticsController.predictMatch);

module.exports = router;
