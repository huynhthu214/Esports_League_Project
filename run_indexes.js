// FILE: run_indexes.js - Dùng direct connection thay SRV
const { MongoClient } = require("mongodb");

// Direct connection - không dùng SRV DNS
const uri =
  "mongodb://esports_league:nhom09123@ac-qzc1ssg-shard-00-00.mtn2vb1.mongodb.net:27017,ac-qzc1ssg-shard-00-01.mtn2vb1.mongodb.net:27017,ac-qzc1ssg-shard-00-02.mtn2vb1.mongodb.net:27017/esports_league?replicaSet=atlas-omgois&ssl=true&authSource=admin";

async function createIndexes() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });
  try {
    await client.connect();
    console.log("✅ Kết nối MongoDB Atlas thành công!");

    const col = client.db("esports_league").collection("match_stats");

    await col.createIndex({ season_id: 1, match_date: -1 });
    console.log("✅ Index 1: { season_id, match_date }");

    await col.createIndex({ "teams.players.player_id": 1 });
    console.log("✅ Index 2: { teams.players.player_id }");

    await col.createIndex({ "teams.team_id": 1 });
    console.log("✅ Index 3: { teams.team_id }");

    const indexes = await col.indexes();
    console.log("\n📋 Indexes hiện tại:");
    indexes.forEach((idx) => console.log(" -", JSON.stringify(idx.key)));
    console.log("\n✅ Tất cả indexes đã tạo xong!");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await client.close();
  }
}

createIndexes();
