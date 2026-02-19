[
  // Stage 1: Tách mảng teams
  { $unwind: "$teams" },
  
  // Stage 2: Tách mảng players
  { $unwind: "$teams.players" },
  
  // Stage 3: Gom nhóm theo PlayerID và tính tổng
  { 
    $group: {
      _id: "$teams.players.player_id",
      total_kills: { $sum: "$teams.players.kills" },
      total_deaths: { $sum: "$teams.players.deaths" },
      total_assists: { $sum: "$teams.players.assists" },
      matches_played: { $sum: 1 }
    }
  },
  
  // Stage 4: Tính KDA an toàn (tránh lỗi chia cho 0)
  { 
    $addFields: {
      kda: {
        $cond: [
          { $eq: ["$total_deaths", 0] },
          { $add: ["$total_kills", "$total_assists"] }, // Nếu chưa chết mạng nào, KDA = Kills + Assists
          { $divide: [ { $add: ["$total_kills", "$total_assists"] }, "$total_deaths" ] }
        ]
      }
    }
  },
  
  // Stage 5: Sắp xếp KDA giảm dần và lấy Top 20
  { $sort: { kda: -1 } },
  { $limit: 20 }
]