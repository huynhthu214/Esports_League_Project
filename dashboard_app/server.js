const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors()); // Cho phép Frontend truy cập API

const uri = "mongodb://esports_league:nhom09123@ac-qzc1ssg-shard-00-00.mtn2vb1.mongodb.net:27017,ac-qzc1ssg-shard-00-01.mtn2vb1.mongodb.net:27017,ac-qzc1ssg-shard-00-02.mtn2vb1.mongodb.net:27017/?ssl=true&replicaSet=atlas-w7ar82-shard-0&authSource=admin&appName=Cluster0";
const client = new MongoClient(uri);

// API Lấy Bảng Xếp Hạng KDA (Bê nguyên Pipeline Tuần 2 vào đây)
app.get('/api/leaderboard', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('esports_league');
        const pipeline = [
            { $unwind: "$teams" },
            { $unwind: "$teams.players" },
            { $group: {
                _id: "$teams.players.player_id",
                total_kills: { $sum: "$teams.players.kills" },
                total_deaths: { $sum: "$teams.players.deaths" },
                total_assists: { $sum: "$teams.players.assists" }
            }},
            { $addFields: {
                kda: { $cond: [{ $eq: ["$total_deaths", 0] }, "$total_kills", { $divide: [{ $add: ["$total_kills", "$total_assists"] }, "$total_deaths"] }] }
            }},
            { $sort: { kda: -1 } },
            { $limit: 10 }
        ];
        const result = await db.collection('match_stats').aggregate(pipeline).toArray();
        res.json(result);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log("Server đang chạy tại http://localhost:3000"));