[
  { $unwind: "$teams" },
  { $unwind: "$teams.players" },
  { 
    $group: {
      _id: "$teams.players.hero",
      pick_count: { $sum: 1 }
    }
  },
  { $sort: { pick_count: -1 } },
  { $limit: 10 }
]