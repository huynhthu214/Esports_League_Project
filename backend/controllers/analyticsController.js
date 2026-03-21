// backend/controllers/analyticsController.js
const { getMongoDb, sql } = require('../config/db');

// 1. Phân tích 50 trận gần nhất của tuyển thủ
exports.getPlayerForm = async (req, res) => {
    try {
        const playerId = req.params.id;
        const mongoDb = getMongoDb();
        const pipeline = [
            { $match: { "teams.players.id": playerId } }, // Lọc trận có người này
            { $sort: { match_id: -1 } }, // Sắp xếp trận mới nhất (giả định match_id tăng dần hoặc dùng timestamp)
            { $limit: 50 }, // Chỉ lấy 50 trận [cite: 645-654]
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $match: { "teams.players.id": playerId } },
            { 
                $group: {
                    _id: "$teams.players.id",
                    avg_kills: { $avg: "$teams.players.kills" },
                    avg_deaths: { $avg: "$teams.players.deaths" },
                    avg_assists: { $avg: "$teams.players.assists" },
                    avg_gold: { $avg: "$teams.players.gold" },
                    total_matches: { $sum: 1 }
                }
            }
        ];
        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result[0] || { message: "Không tìm thấy dữ liệu" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Lịch sử đối đầu 5 trận gần nhất (H2H)
exports.getTeamH2H = async (req, res) => {
    try {
        const { team1, team2 } = req.query; // Ví dụ: /api/analytics/h2h?team1=SGD&team2=HNL
        const mongoDb = getMongoDb();
        
        // Tìm các trận mà cả 2 đội đều tham gia [cite: 713-724]
        const pipeline = [
            { $match: { "teams.team_id": { $all: [team1, team2] } } },
            { $sort: { match_id: -1 } },
            { $limit: 5 }
        ];
        
        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. API Báo cáo tổng mùa giải (Nhiệm vụ chung: JOIN SQL & NoSQL)
exports.getSeasonReport = async (req, res) => {
    try {
        const seasonId = req.params.id;
        const mongoDb = getMongoDb();

        // Bước 1: Lấy Bảng xếp hạng từ MS SQL [cite: 699-712]
        const sqlResult = await sql.query(`SELECT * FROM TeamStandings WHERE SeasonID = '${seasonId}' ORDER BY Wins DESC`);
        
        // Bước 2: Lấy tổng số trận từ MongoDB [cite: 699-712]
        const totalMatches = await mongoDb.collection('match_stats').countDocuments({ season_id: seasonId });

        // Gộp dữ liệu trả về
        res.status(200).json({
            season_id: seasonId,
            total_matches_played: totalMatches,
            standings: sqlResult.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};