const sql = require("mssql");
const { MongoClient } = require("mongodb");

// ── MS SQL ────────────────────────────────────────────────────
const sqlConfig = {
  user: process.env.SQL_USER || "sa",
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE || "EsportsLeagueDB",
  server: process.env.SQL_SERVER || "localhost",
  port: parseInt(process.env.SQL_PORT) || 1433,
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let sqlPool = null;

const connectSQL = async () => {
  sqlPool = await sql.connect(sqlConfig);
  console.log("✅ MS SQL Server connected");
  return sqlPool;
};

const getPool = () => {
  if (!sqlPool) throw new Error("SQL pool chưa khởi tạo");
  return sqlPool;
};

// ── MongoDB Native Driver ─────────────────────────────────────
let mongoClient = null;
let mongoDb = null;

const connectMongo = async () => {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    // Lấy tên DB từ URI (phần sau dấu / cuối cùng, trước dấu ?)
    const dbName =
      process.env.MONGODB_URI.split("/").pop().split("?")[0] ||
      "esports_league";
    mongoDb = mongoClient.db(dbName);
    console.log(`✅ MongoDB Atlas connected — db: ${dbName}`);
  } catch (err) {
    console.warn(
      "⚠️  MongoDB không kết nối được — analytics sẽ không hoạt động.",
    );
    console.warn("   Lý do:", err.message.split("\n")[0]);
  }
};

const getMongoDb = () => {
  if (!mongoDb) throw new Error("MongoDB chưa kết nối");
  return mongoDb;
};

module.exports = { connectSQL, connectMongo, getPool, getMongoDb, sql };
