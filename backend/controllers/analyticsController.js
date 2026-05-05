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
    const { seasonId, limit = 10, sortBy = "pick_count" } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 5), 50);
    const sortMap = {
      pick_count: { pick_count: -1 },
      win_rate: { win_rate: -1, pick_count: -1 },
      avg_kda: { avg_kda: -1, pick_count: -1 },
      avg_gpm: { avg_gpm: -1, pick_count: -1 },
    };
    const sortStage = sortMap[sortBy] || sortMap.pick_count;
    const matchStage = seasonId
      ? { $match: { season_id: seasonId } }
      : { $match: {} };
    const agg = await getMongoDb()
      .collection("match_stats")
      .aggregate([
        matchStage,
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        { $match: { "teams.players.hero": { $ne: null } } },
        {
          $addFields: {
            __hero: "$teams.players.hero",
            __kills: { $ifNull: ["$teams.players.kills", 0] },
            __deaths: { $ifNull: ["$teams.players.deaths", 0] },
            __assists: { $ifNull: ["$teams.players.assists", 0] },
            __gold: { $ifNull: ["$teams.players.gold", 0] },
            __duration: { $ifNull: ["$duration_minutes", 0] },
            __win: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
          },
        },
        {
          $addFields: {
            __kda: {
              $divide: [
                { $add: ["$__kills", "$__assists"] },
                { $cond: [{ $gt: ["$__deaths", 0] }, "$__deaths", 1] },
              ],
            },
            __gpm: {
              $cond: [
                { $gt: ["$__duration", 0] },
                { $divide: ["$__gold", "$__duration"] },
                null,
              ],
            },
          },
        },
        {
          $facet: {
            totals: [{ $count: "total_picks" }],
            heroes: [
              {
                $group: {
                  _id: "$__hero",
                  pick_count: { $sum: 1 },
                  win_count: { $sum: "$__win" },
                  avg_kills: { $avg: "$__kills" },
                  avg_deaths: { $avg: "$__deaths" },
                  avg_assists: { $avg: "$__assists" },
                  avg_gold: { $avg: "$__gold" },
                  avg_kda: { $avg: "$__kda" },
                  avg_gpm: { $avg: "$__gpm" },
                },
              },
              {
                $project: {
                  _id: 1,
                  pick_count: 1,
                  win_rate: {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$win_count", "$pick_count"] },
                          100,
                        ],
                      },
                      1,
                    ],
                  },
                  avg_kills: { $round: ["$avg_kills", 1] },
                  avg_deaths: { $round: ["$avg_deaths", 1] },
                  avg_assists: { $round: ["$avg_assists", 1] },
                  avg_gold: { $round: ["$avg_gold", 0] },
                  avg_kda: { $round: ["$avg_kda", 2] },
                  avg_gpm: {
                    $cond: [
                      { $ne: ["$avg_gpm", null] },
                      { $round: ["$avg_gpm", 0] },
                      null,
                    ],
                  },
                },
              },
              { $sort: sortStage },
              { $limit: safeLimit },
            ],
          },
        },
      ])
      .toArray();

    const totalPicks = agg?.[0]?.totals?.[0]?.total_picks || 0;
    const heroes = (agg?.[0]?.heroes || []).map((h) => ({
      ...h,
      pick_rate:
        totalPicks > 0 ? +((h.pick_count / totalPicks) * 100).toFixed(2) : 0,
    }));

    res.json({ total_picks: totalPicks, heroes });
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

// 7. Timeseries theo tuyển thủ (MongoDB) — phục vụ Line chart
// GET /api/analytics/players/:id/timeseries?seasonId=SS2025&limit=10
exports.getPlayerTimeseries = async (req, res) => {
  try {
    const playerId = req.params.id;
    const { seasonId, limit = 10 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 5), 30);

    const matchStage = {
      $match: {
        ...(seasonId ? { season_id: seasonId } : {}),
        "teams.players.player_id": playerId,
      },
    };

    const rows = await getMongoDb()
      .collection("match_stats")
      .aggregate([
        matchStage,
        { $sort: { match_date: -1 } },
        { $limit: safeLimit },
        { $unwind: "$teams" },
        { $unwind: "$teams.players" },
        { $match: { "teams.players.player_id": playerId } },
        {
          $project: {
            _id: 0,
            match_id: 1,
            season_id: 1,
            match_date: 1,
            team_id: "$teams.team_id",
            result: "$teams.result",
            kills: { $ifNull: ["$teams.players.kills", 0] },
            deaths: { $ifNull: ["$teams.players.deaths", 0] },
            assists: { $ifNull: ["$teams.players.assists", 0] },
            gold: { $ifNull: ["$teams.players.gold", 0] },
            duration_minutes: { $ifNull: ["$duration_minutes", 0] },
          },
        },
        {
          $addFields: {
            kda: {
              $divide: [
                { $add: ["$kills", "$assists"] },
                { $cond: [{ $gt: ["$deaths", 0] }, "$deaths", 1] },
              ],
            },
            gpm: {
              $cond: [
                { $gt: ["$duration_minutes", 0] },
                { $divide: ["$gold", "$duration_minutes"] },
                null,
              ],
            },
          },
        },
        {
          $project: {
            match_id: 1,
            match_date: 1,
            season_id: 1,
            team_id: 1,
            result: 1,
            kills: 1,
            deaths: 1,
            assists: 1,
            gold: 1,
            kda: { $round: ["$kda", 2] },
            gpm: {
              $cond: [{ $ne: ["$gpm", null] }, { $round: ["$gpm", 0] }, null],
            },
          },
        },
        { $sort: { match_date: 1 } },
      ])
      .toArray();

    res.json({ playerId, seasonId: seasonId || null, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. So kèo 2 đội (MongoDB) — radar/tổng quan
// GET /api/analytics/compare-teams?team1=SGD&team2=HNL&seasonId=SS2025
exports.compareTeams = async (req, res) => {
  try {
    const { team1, team2, seasonId } = req.query;
    if (!team1 || !team2)
      return res.status(400).json({ message: "Thiếu team1 hoặc team2." });

    const matchStage = {
      $match: {
        ...(seasonId ? { season_id: seasonId } : {}),
        "teams.team_id": { $in: [team1, team2] },
      },
    };

    const rows = await getMongoDb()
      .collection("match_stats")
      .aggregate([
        matchStage,
        { $unwind: "$teams" },
        { $match: { "teams.team_id": { $in: [team1, team2] } } },
        {
          $addFields: {
            __team: "$teams.team_id",
            __win: { $cond: [{ $eq: ["$teams.result", "WIN"] }, 1, 0] },
            __kills: { $sum: "$teams.players.kills" },
            __gold: { $sum: "$teams.players.gold" },
          },
        },
        {
          $group: {
            _id: "$__team",
            matches: { $sum: 1 },
            wins: { $sum: "$__win" },
            avg_kills: { $avg: "$__kills" },
            avg_gold: { $avg: "$__gold" },
          },
        },
        {
          $project: {
            _id: 1,
            matches: 1,
            win_rate: {
              $round: [
                { $multiply: [{ $divide: ["$wins", "$matches"] }, 100] },
                1,
              ],
            },
            avg_kills: { $round: ["$avg_kills", 1] },
            avg_gold: { $round: ["$avg_gold", 0] },
          },
        },
      ])
      .toArray();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. External provider status (PandaScore/Abios) — skeleton
// GET /api/analytics/external/status
exports.getExternalStatus = async (req, res) => {
  const hasPanda =
    !!process.env.PANDASCORE_TOKEN &&
    String(process.env.PANDASCORE_TOKEN).trim();
  const hasAbios =
    !!process.env.ABIOS_TOKEN && String(process.env.ABIOS_TOKEN).trim();

  res.json({
    providers: {
      pandascore: { configured: !!hasPanda },
      abios: { configured: !!hasAbios },
    },
    note: "Chỉ là khung tích hợp. Khi có token, có thể mở rộng gọi API gốc để tự động cập nhật chỉ số.",
  });
};
