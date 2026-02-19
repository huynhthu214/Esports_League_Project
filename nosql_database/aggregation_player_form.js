[
  // Stage 1: Lọc các trận có P001 thi đấu
  { $match: { "teams.players.player_id": "P001" } },
  
  // Stage 2: Sắp xếp ngày thi đấu gần nhất đưa lên đầu
  { $sort: { match_date: -1 } },
  
  // Stage 3: Lấy đúng 50 trận
  { $limit: 50 },
  
  // Stage 4 & 5: Unwind để lấy đúng stats của P001 (vì document gốc chứa cả 10 người)
  { $unwind: "$teams" },
  { $unwind: "$teams.players" },
  { $match: { "teams.players.player_id": "P001" } },
  
  // Stage 6: Tính trung bình chỉ số
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
]