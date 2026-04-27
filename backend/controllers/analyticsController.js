const { getMongoDb, getPool, sql } = require('../config/db');
const PDFDocument = require('pdfkit');

// ================================================================
// 1. Phân tích phong độ tuyển thủ (50 trận gần nhất)
// GET /api/analytics/players/:id/form
// NÂNG CẤP: KDA tính per-match (không phải avg/avg), thêm avg_gpm, bucket
// ================================================================
exports.getPlayerForm = async (req, res) => {
    try {
        const playerId = req.params.id;
        const mongoDb = getMongoDb();

        // Pipeline lấy từng trận (để vẽ line chart)
        const pipeline = [
            { $match: { "teams.players.player_id": playerId } },
            { $sort: { match_date: -1 } },
            { $limit: 50 },
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $match: { "teams.players.player_id": playerId } },
            {
                $addFields: {
                    kda_per_match: {
                        $divide: [
                            { $add: ["$teams.players.kills", "$teams.players.assists"] },
                            { $max: ["$teams.players.deaths", 1] }
                        ]
                    },
                    gpm_per_match: {
                        $cond: {
                            if: { $gt: ["$duration_minutes", 0] },
                            then: { $divide: ["$teams.players.gold", "$duration_minutes"] },
                            else: 0
                        }
                    },
                    is_win: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] }
                }
            },
            {
                $project: {
                    match_id: 1, match_date: 1, season_id: 1,
                    hero: "$teams.players.hero",
                    kills: "$teams.players.kills",
                    deaths: "$teams.players.deaths",
                    assists: "$teams.players.assists",
                    gold: "$teams.players.gold",
                    result: "$teams.result",
                    kda: { $round: ["$kda_per_match", 2] },
                    gpm: { $round: ["$gpm_per_match", 1] },
                    is_win: 1
                }
            },
            { $sort: { match_date: 1 } }
        ];

        const matches = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();

        const total = matches.length;
        const wins = matches.filter(m => m.is_win === 1).length;
        const avg = (arr) => total > 0 ? arr.reduce((s, v) => s + (v || 0), 0) / total : 0;

        const avgKDA = avg(matches.map(m => m.kda));
        const avgGPM = avg(matches.map(m => m.gpm));
        const avgKills = avg(matches.map(m => m.kills));
        const avgDeaths = avg(matches.map(m => m.deaths));
        const avgAssists = avg(matches.map(m => m.assists));
        const avgGold = avg(matches.map(m => m.gold));

        // KDA distribution (bucket)
        const buckets = { "Poor (< 2)": 0, "Average (2–4)": 0, "Good (4–6)": 0, "Excellent (6+)": 0 };
        matches.forEach(m => {
            const k = m.kda || 0;
            if (k < 2) buckets["Poor (< 2)"]++;
            else if (k < 4) buckets["Average (2–4)"]++;
            else if (k < 6) buckets["Good (4–6)"]++;
            else buckets["Excellent (6+)"]++;
        });

        res.status(200).json({
            player_id: playerId,
            total_matches: total,
            wins,
            win_rate: total > 0 ? Math.round((wins / total) * 100) : 0,
            avg_kda:     Math.round(avgKDA * 100) / 100,
            avg_gpm:     Math.round(avgGPM * 10) / 10,
            avg_kills:   Math.round(avgKills * 100) / 100,
            avg_deaths:  Math.round(avgDeaths * 100) / 100,
            avg_assists: Math.round(avgAssists * 100) / 100,
            avg_gold:    Math.round(avgGold),
            kda_distribution: buckets,
            matches
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// 2. So sánh 2 tuyển thủ — thêm avg_gpm, filter seasonId
// GET /api/analytics/compare?p1=P001&p2=P002&seasonId=SS2025
// ================================================================
exports.comparePlayers = async (req, res) => {
    try {
        const { p1, p2, seasonId } = req.query;
        const mongoDb = getMongoDb();

        const matchFilter = { "teams.players.player_id": { $in: [p1, p2] } };
        if (seasonId) matchFilter.season_id = seasonId;

        const pipeline = [
            { $match: matchFilter },
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $match: { "teams.players.player_id": { $in: [p1, p2] } } },
            {
                $addFields: {
                    kda_val: {
                        $divide: [
                            { $add: ["$teams.players.kills", "$teams.players.assists"] },
                            { $max: ["$teams.players.deaths", 1] }
                        ]
                    },
                    gpm_val: {
                        $cond: {
                            if: { $gt: ["$duration_minutes", 0] },
                            then: { $divide: ["$teams.players.gold", "$duration_minutes"] },
                            else: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$teams.players.player_id",
                    avg_kills:   { $avg: "$teams.players.kills" },
                    avg_deaths:  { $avg: "$teams.players.deaths" },
                    avg_assists: { $avg: "$teams.players.assists" },
                    avg_gold:    { $avg: "$teams.players.gold" },
                    avg_kda:     { $avg: "$kda_val" },
                    avg_gpm:     { $avg: "$gpm_val" },
                    matches:     { $sum: 1 },
                    wins:        { $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 1,
                    avg_kills:   { $round: ["$avg_kills", 2] },
                    avg_deaths:  { $round: ["$avg_deaths", 2] },
                    avg_assists: { $round: ["$avg_assists", 2] },
                    avg_gold:    { $round: ["$avg_gold", 0] },
                    avg_kda:     { $round: ["$avg_kda", 2] },
                    avg_gpm:     { $round: ["$avg_gpm", 1] },
                    matches:     1,
                    win_rate:    { $round: [{ $multiply: [{ $divide: ["$wins", { $max: ["$matches", 1] }] }, 100] }, 1] }
                }
            }
        ];

        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// 3. Lịch sử đối đầu H2H — giữ nguyên, đã ổn
// GET /api/analytics/h2h?team1=SGD&team2=HNL
// ================================================================
exports.getTeamH2H = async (req, res) => {
    try {
        const { team1, team2 } = req.query;
        const mongoDb = getMongoDb();

        const pipeline = [
            { $match: { "teams.team_id": { $all: [team1, team2] } } },
            { $sort: { match_date: -1 } },
            { $limit: 10 },
            {
                $project: {
                    match_id: 1, season_id: 1, match_date: 1,
                    teams: {
                        $map: {
                            input: "$teams", as: "team",
                            in: {
                                team_id: "$$team.team_id",
                                result: "$$team.result",
                                player_count: { $size: { $ifNull: ["$$team.players", []] } },
                                total_kills: { $sum: "$$team.players.kills" }
                            }
                        }
                    }
                }
            }
        ];

        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        const team1Wins = result.filter(m => m.teams.find(t => t.team_id === team1)?.result === 'WIN').length;
        const team2Wins = result.filter(m => m.teams.find(t => t.team_id === team2)?.result === 'WIN').length;

        res.status(200).json({
            team1, team2,
            total_matches: result.length,
            team1_wins: team1Wins,
            team2_wins: team2Wins,
            matches: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// 4. Meta Tướng — NÂNG CẤP: seasonId filter + win_rate đã có
// GET /api/analytics/meta-heroes?seasonId=SS2025&limit=10
// ================================================================
exports.getMetaHeroes = async (req, res) => {
    try {
        const { seasonId, limit = 10 } = req.query;
        const mongoDb = getMongoDb();

        // seasonId được truyền vào $match — fix từ bản gốc (đã có matchFilter nhưng thiếu)
        const matchFilter = {};
        if (seasonId) matchFilter.season_id = seasonId;

        const pipeline = [
            { $match: matchFilter },
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            {
                $group: {
                    _id: "$teams.players.hero",
                    pick_count: { $sum: 1 },
                    win_count:  { $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] } },
                    avg_kills:  { $avg: "$teams.players.kills" },
                    avg_gold:   { $avg: "$teams.players.gold" }
                }
            },
            { $match: { _id: { $ne: null } } },
            {
                $project: {
                    _id: 1, pick_count: 1, win_count: 1,
                    avg_kills: { $round: ["$avg_kills", 1] },
                    avg_gold:  { $round: ["$avg_gold", 0] },
                    win_rate:  {
                        $round: [
                            { $multiply: [{ $divide: ["$win_count", { $max: ["$pick_count", 1] }] }, 100] },
                            1
                        ]
                    }
                }
            },
            { $sort: { pick_count: -1 } },
            { $limit: parseInt(limit) }
        ];

        const result = await mongoDb.collection('match_stats').aggregate(pipeline).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ================================================================
// 5–7. Báo cáo mùa giải, PDF, Dự đoán — giữ nguyên từ bản gốc
// ================================================================
exports.getSeasonReport = async (req, res) => {
    try {
        const seasonId = req.params.id;
        const mongoDb = getMongoDb();

        const sqlResult = await getPool().request()
            .input('SeasonId', sql.VarChar, seasonId)
            .query(`
                SELECT ts.TeamID, t.TeamName, t.ShortName,
                       ts.Wins, ts.Losses, ts.WinRate, ts.Points, ts.GoalDiff
                FROM TeamStandings ts
                JOIN Teams t ON t.TeamID = ts.TeamID
                WHERE ts.SeasonID = @SeasonId
                ORDER BY ts.Wins DESC, ts.WinRate DESC
            `);

        const totalMatches = await mongoDb.collection('match_stats').countDocuments({ season_id: seasonId });

        const killStats = await mongoDb.collection('match_stats').aggregate([
            { $match: { season_id: seasonId } },
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $group: { _id: null, total_kills: { $sum: "$teams.players.kills" } } }
        ]).toArray();

        const topPlayers = await getPool().request()
            .input('SeasonId', sql.VarChar, seasonId)
            .query(`
                SELECT TOP 3
                    p.Nickname, p.Position, t.ShortName AS TeamShort,
                    pss.AvgKDA, pss.WinRate, pss.TotalMatches
                FROM PlayerSeasonStats pss
                JOIN Players p ON p.PlayerID = pss.PlayerID
                JOIN Teams t ON t.TeamID = pss.TeamID
                WHERE pss.SeasonID = @SeasonId AND pss.TotalMatches >= 5
                ORDER BY pss.AvgKDA DESC
            `);

        res.status(200).json({
            season_id: seasonId,
            total_matches_played: totalMatches,
            total_kills: killStats[0]?.total_kills || 0,
            avg_kills_per_match: totalMatches > 0 ? Math.round((killStats[0]?.total_kills || 0) / totalMatches * 10) / 10 : 0,
            standings: sqlResult.recordset,
            top_players: topPlayers.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSeasonReportPDF = async (req, res) => {
    try {
        const seasonId = req.params.id;
        const mongoDb = getMongoDb();

        const sqlResult = await getPool().request()
            .input('SeasonId', sql.VarChar, seasonId)
            .query(`SELECT TeamID, Wins, Losses, WinRate FROM TeamStandings WHERE SeasonID = @SeasonId ORDER BY Wins DESC, WinRate DESC`);
        const standings = sqlResult.recordset;
        const totalMatches = await mongoDb.collection('match_stats').countDocuments({ season_id: seasonId });
        const killStats = await mongoDb.collection('match_stats').aggregate([
            { $match: { season_id: seasonId } }, { $unwind: "$teams" }, { $unwind: "$teams.players" },
            { $group: { _id: null, total_kills: { $sum: "$teams.players.kills" } } }
        ]).toArray();
        const totalKills = killStats[0]?.total_kills || 0;

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-disposition', `attachment; filename="BaoCao_${seasonId}.pdf"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);
        doc.fontSize(22).text('NEXUS ESPORTS LEAGUE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`BAO CAO TONG QUAN MUA GIAI: ${seasonId}`, { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(14).text('1. THONG KE CHUNG (Tu MongoDB)', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`- Tong so tran: ${totalMatches}`).text(`- Tong kills: ${totalKills}`);
        if (totalMatches > 0) doc.text(`- TB kills/tran: ${(totalKills / totalMatches).toFixed(1)}`);
        doc.moveDown(2);
        doc.fontSize(14).text('2. BANG XEP HANG DOI (Tu MS SQL Server)', { underline: true });
        doc.moveDown(0.5);
        standings.forEach((t, i) => doc.fontSize(12).text(`${i+1}. ${t.TeamID} | ${t.Wins}W ${t.Losses}L | ${t.WinRate}%`));
        doc.moveDown(3);
        doc.fontSize(10).text(`Xuat: ${new Date().toLocaleString('vi-VN')}`, { align: 'right' });
        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.predictMatch = async (req, res) => {
    try {
        const { team1, team2, seasonId } = req.query;
        if (!team1 || !team2) return res.status(400).json({ message: 'Cần truyền team1 và team2.' });

        const pool = getPool();
        const standingsQ = await pool.request()
            .input('t1', sql.VarChar, team1).input('t2', sql.VarChar, team2)
            .input('sid', sql.VarChar, seasonId || '')
            .query(`
                SELECT ts.TeamID, t.TeamName, t.ShortName, ts.Wins, ts.Losses, ts.WinRate, ts.Points, ts.GoalDiff
                FROM TeamStandings ts JOIN Teams t ON t.TeamID = ts.TeamID
                WHERE ts.TeamID IN (@t1, @t2) ${seasonId ? 'AND ts.SeasonID = @sid' : ''}
            `);
        const standings = standingsQ.recordset;
        const s1 = standings.find(s => s.TeamID === team1) || { WinRate: 50, Wins: 0, GoalDiff: 0 };
        const s2 = standings.find(s => s.TeamID === team2) || { WinRate: 50, Wins: 0, GoalDiff: 0 };

        const mongoDb = getMongoDb();
        const h2hFilter = { "teams.team_id": { $all: [team1, team2] } };
        if (seasonId) h2hFilter.season_id = seasonId;
        const h2hMatches = await mongoDb.collection('match_stats').find(h2hFilter, { projection: { teams: 1 } }).sort({ match_date: -1 }).limit(10).toArray();
        const h2hTotal = h2hMatches.length;
        const h2hWinsT1 = h2hMatches.filter(m => m.teams?.find(t => t.team_id === team1)?.result === 'WIN').length;
        const h2hWinsT2 = h2hTotal - h2hWinsT1;

        const gd1 = Math.max(0, (s1.GoalDiff || 0) + 10);
        const gd2 = Math.max(0, (s2.GoalDiff || 0) + 10);
        const h2h1 = h2hTotal > 0 ? (h2hWinsT1 / h2hTotal) * 100 : 50;
        const h2h2 = h2hTotal > 0 ? (h2hWinsT2 / h2hTotal) * 100 : 50;
        const raw1 = parseFloat(s1.WinRate||50)*0.5 + gd1*0.2 + h2h1*0.3;
        const raw2 = parseFloat(s2.WinRate||50)*0.5 + gd2*0.2 + h2h2*0.3;
        const total = raw1 + raw2;
        const prob1 = total > 0 ? Math.round((raw1/total)*100) : 50;
        const prob2 = 100 - prob1;

        res.status(200).json({
            team1: { id: team1, name: s1.TeamName, shortName: s1.ShortName, win_probability: prob1, wins: s1.Wins, win_rate: s1.WinRate, goal_diff: s1.GoalDiff, h2h_wins: h2hWinsT1 },
            team2: { id: team2, name: s2.TeamName, shortName: s2.ShortName, win_probability: prob2, wins: s2.Wins, win_rate: s2.WinRate, goal_diff: s2.GoalDiff, h2h_wins: h2hWinsT2 },
            h2h_total: h2hTotal,
            prediction: prob1 > prob2 ? team1 : (prob2 > prob1 ? team2 : 'TIE'),
            confidence: Math.abs(prob1 - prob2),
            factors: { win_rate_weight: '50%', goal_diff_weight: '20%', h2h_weight: '30%' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
