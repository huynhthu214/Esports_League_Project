const { getMongoDb, sql } = require('../config/db');

// 1. Phân tích 50 trận gần nhất của tuyển thủ
exports.getPlayerForm = async (req, res) => {
    try {
        const playerId = req.params.id; 
        const mongoDb = getMongoDb();
        
        const pipeline = [
            { $match: { "teams.players.player_id": playerId } }, 
            { $sort: { match_date: -1 } }, 
            { $limit: 50 }, 
            { $unwind: "$teams" },
            { $unwind: "$teams.players" }, 
            { $match: { "teams.players.player_id": playerId } }, 
            { 
                $group: {
                    _id: "$teams.players.player_id",
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

// 2. So sánh trực diện 2 người chơi
exports.comparePlayers = async (req, res) => {
    try {
        const { p1, p2 } = req.query; 
        const mongoDb = getMongoDb();

        const pipeline = [
            { $match: { "teams.players.player_id": { $in: [p1, p2] } } },
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $match: { "teams.players.player_id": { $in: [p1, p2] } } },
            { 
                $group: {
                    _id: "$teams.players.player_id",
                    avg_kills: { $avg: "$teams.players.kills" },
                    avg_deaths: { $avg: "$teams.players.deaths" },
                    avg_assists: { $avg: "$teams.players.assists" },
                    avg_gold: { $avg: "$teams.players.gold" },
                    matches: { $sum: 1 },
                    wins: { $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 1, avg_kills: 1, avg_deaths: 1, avg_assists: 1, avg_gold: 1, matches: 1,
                    win_rate: { $round: [{ $multiply: [{ $divide: ["$wins", "$matches"] }, 100] }, 1] }
                }
            }
        ];
        
        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Lịch sử đối đầu (H2H) giữa 2 đội
exports.getTeamH2H = async (req, res) => {
    try {
        const { team1, team2 } = req.query; 
        const mongoDb = getMongoDb();
        
        const pipeline = [
            { $match: { "teams.team_id": { $all: [team1, team2] } } },
            { $sort: { match_date: -1 } },
            { $limit: 5 }
        ];
        
        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Meta Tướng (Top 10 Pick)
exports.getMetaHeroes = async (req, res) => {
    try {
        const mongoDb = getMongoDb();
        const pipeline = [
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { 
                $group: {
                    _id: "$teams.players.hero", 
                    pick_count: { $sum: 1 }
                }
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { pick_count: -1 } }, 
            { $limit: 10 } 
        ];

        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Báo cáo tổng mùa giải (Nhiệm vụ chung: Gộp SQL + NoSQL)
exports.getSeasonReport = async (req, res) => {
    try {
        const seasonId = req.params.id;
        const mongoDb = getMongoDb();

        // Lấy Bảng xếp hạng từ MS SQL
        const request = new sql.Request();
        request.input('SeasonId', sql.VarChar, seasonId);
        const sqlResult = await request.query(`
            SELECT * FROM TeamStandings 
            WHERE SeasonID = @SeasonId 
            ORDER BY Wins DESC, WinRate DESC
        `);
        
        // Lấy tổng số trận từ MongoDB
        const totalMatches = await mongoDb.collection('match_stats').countDocuments({ season_id: seasonId });

        res.status(200).json({
            season_id: seasonId,
            total_matches_played: totalMatches,
            standings: sqlResult.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};