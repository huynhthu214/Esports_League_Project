const { getMongoDb, getPool, sql } = require("../config/db");

// 1. Phong độ tuyển thủ — 50 trận gần nhất (MongoDB)
exports.getPlayerForm = async (req, res) => {
  try {
    const playerId = req.params.id;
    const result = await getMongoDb()
      .collection("match_stats")
      .aggregate([
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
            total_matches: { $sum: 1 },
            wins: {
              $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            avg_kills: 1,
            avg_deaths: 1,
            avg_assists: 1,
            avg_gold: 1,
            total_matches: 1,
            win_rate: {
              $round: [
                { $multiply: [{ $divide: ["$wins", "$total_matches"] }, 100] },
                1,
              ],
            },
            avg_kda: {
              $round: [
                {
                  $divide: [
                    { $add: ["$avg_kills", "$avg_assists"] },
                    { $cond: [{ $eq: ["$avg_deaths", 0] }, 1, "$avg_deaths"] },
                  ],
                },
                2,
              ],
            },
          },
        },
      ])
      .toArray();
    if (!result.length)
      return res.status(404).json({ message: "Không tìm thấy dữ liệu." });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. So sánh 2 tuyển thủ (MongoDB)
exports.comparePlayers = async (req, res) => {
  try {
    const { p1, p2 } = req.query;
    if (!p1 || !p2)
      return res.status(400).json({ message: "Thiếu p1 hoặc p2." });
    const result = await getMongoDb()
      .collection("match_stats")
      .aggregate([
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
            wins: {
              $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            avg_kills: 1,
            avg_deaths: 1,
            avg_assists: 1,
            avg_gold: 1,
            matches: 1,
            win_rate: {
              $round: [
                { $multiply: [{ $divide: ["$wins", "$matches"] }, 100] },
                1,
              ],
            },
            survivability: { $subtract: [10, "$avg_deaths"] },
          },
        },
      ])
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. H2H đối đầu (MongoDB)
exports.getTeamH2H = async (req, res) => {
  try {
    const { team1, team2 } = req.query;
    if (!team1 || !team2)
      return res.status(400).json({ message: "Thiếu team1 hoặc team2." });
    const result = await getMongoDb()
      .collection("match_stats")
      .aggregate([
        { $match: { "teams.team_id": { $all: [team1, team2] } } },
        { $sort: { match_date: -1 } },
        { $limit: 10 },
        {
          $project: {
            match_id: 1,
            season_id: 1,
            match_date: 1,
            teams: {
              $map: {
                input: "$teams",
                as: "t",
                in: {
                  team_id: "$$t.team_id",
                  result: "$$t.result",
                  score: "$$t.score",
                  total_kills: { $sum: "$$t.players.kills" },
                  total_gold: { $sum: "$$t.players.gold" },
                },
              },
            },
          },
        },
      ])
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Meta Tướng (MongoDB)
exports.getMetaHeroes = async (req, res) => {
  try {
    const { seasonId } = req.query;
    const matchStage = seasonId
      ? { $match: { season_id: seasonId } }
      : { $match: {} };
    const result = await getMongoDb()
      .collection("match_stats")
      .aggregate([
        matchStage,
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        {
          $group: {
            _id: "$teams.players.hero",
            pick_count: { $sum: 1 },
            win_count: {
              $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
            },
          },
        },
        { $match: { _id: { $ne: null } } },
        {
          $project: {
            _id: 1,
            pick_count: 1,
            win_rate: {
              $round: [
                {
                  $multiply: [{ $divide: ["$win_count", "$pick_count"] }, 100],
                },
                1,
              ],
            },
          },
        },
        { $sort: { pick_count: -1 } },
        { $limit: 10 },
      ])
      .toArray();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Báo cáo mùa giải (SQL + MongoDB)
exports.getSeasonReport = async (req, res) => {
  try {
    const seasonId = req.params.id;
    const pool = getPool();
    const mongoDb = getMongoDb();
    const [standRes, topRes, totalMatches, heroStats] = await Promise.all([
      pool
        .request()
        .input("sid", sql.VarChar(10), seasonId)
        .query(
          `SELECT Standing_Rank,TeamName,ShortName,Wins,Losses,Points,WinRate FROM vw_TeamStandings WHERE SeasonID=@sid ORDER BY Standing_Rank`,
        ),
      pool
        .request()
        .input("sid", sql.VarChar(10), seasonId)
        .query(
          `SELECT TOP 5 KDA_Rank,Nickname,Position,TeamShort,AvgKDA,AvgGPM,WinRate FROM vw_Leaderboard_KDA WHERE SeasonID=@sid ORDER BY KDA_Rank`,
        ),
      mongoDb.collection("match_stats").countDocuments({ season_id: seasonId }),
      mongoDb
        .collection("match_stats")
        .aggregate([
          { $match: { season_id: seasonId } },
          { $unwind: "$teams" },
          { $unwind: "$teams.players" },
          { $group: { _id: "$teams.players.hero", pick_count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { pick_count: -1 } },
          { $limit: 5 },
        ])
        .toArray(),
    ]);
    res.json({
      season_id: seasonId,
      total_matches_mongo: totalMatches,
      standings: standRes.recordset,
      top_players: topRes.recordset,
      top_heroes: heroStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Dự đoán trận (SQL win rate + MongoDB form)
exports.predictMatch = async (req, res) => {
  try {
    const { team1, team2, seasonId } = req.query;
    if (!team1 || !team2 || !seasonId)
      return res
        .status(400)
        .json({ message: "Thiếu team1, team2 hoặc seasonId." });
    const pool = getPool();
    const mongoDb = getMongoDb();
    const [standRes, formRes] = await Promise.all([
      pool
        .request()
        .input("sid", sql.VarChar(10), seasonId)
        .query(
          `SELECT TeamID,ShortName,Wins,Losses,WinRate,Points FROM vw_TeamStandings WHERE SeasonID=@sid`,
        ),
      mongoDb
        .collection("match_stats")
        .aggregate([
          {
            $match: {
              season_id: seasonId,
              "teams.team_id": { $in: [team1, team2] },
            },
          },
          { $sort: { match_date: -1 } },
          { $limit: 10 },
          { $unwind: "$teams" },
          { $match: { "teams.team_id": { $in: [team1, team2] } } },
          {
            $group: {
              _id: "$teams.team_id",
              recent_wins: {
                $sum: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
              },
              recent_matches: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);
    const t1sql =
      standRes.recordset.find(
        (t) => t.TeamID === team1 || t.ShortName === team1,
      ) || {};
    const t2sql =
      standRes.recordset.find(
        (t) => t.TeamID === team2 || t.ShortName === team2,
      ) || {};
    const t1m = formRes.find((t) => t._id === team1) || {
      recent_wins: 0,
      recent_matches: 1,
    };
    const t2m = formRes.find((t) => t._id === team2) || {
      recent_wins: 0,
      recent_matches: 1,
    };
    const sc = (sq, mo) =>
      (sq.WinRate || 0) * 0.5 +
      (sq.Points || 0) * 0.3 +
      (mo.recent_matches > 0
        ? (mo.recent_wins / mo.recent_matches) * 100 * 0.2
        : 0);
    const s1 = sc(t1sql, t1m),
      s2 = sc(t2sql, t2m),
      total = s1 + s2 || 1;
    res.json({
      team1: {
        id: team1,
        name: t1sql.ShortName || team1,
        win_prob: +((s1 / total) * 100).toFixed(1),
        wins: t1sql.Wins || 0,
        losses: t1sql.Losses || 0,
        win_rate: t1sql.WinRate || 0,
        recent_wins: t1m.recent_wins,
        recent_matches: t1m.recent_matches,
      },
      team2: {
        id: team2,
        name: t2sql.ShortName || team2,
        win_prob: +((s2 / total) * 100).toFixed(1),
        wins: t2sql.Wins || 0,
        losses: t2sql.Losses || 0,
        win_rate: t2sql.WinRate || 0,
        recent_wins: t2m.recent_wins,
        recent_matches: t2m.recent_matches,
      },
      prediction: s1 > s2 ? t1sql.ShortName || team1 : t2sql.ShortName || team2,
      confidence: +((Math.abs(s1 - s2) / total) * 100).toFixed(1),
      note: "Win Rate (50%) + Điểm SQL (30%) + Form MongoDB (20%)",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
