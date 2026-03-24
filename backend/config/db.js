// backend/config/db.js
const sql = require("mssql");
const mongoose = require("mongoose");

// Cấu hình MS SQL
const sqlConfig = {
  user: "sa",
  password: "123456", // Đảm bảo đúng pass bạn đã đổi
  database: "EsportsLeagueDB", // ĐIỀN ĐÚNG TÊN DATABASE BẠN TẠO TRONG SSMS
  server: "localhost", 
  port: 1433,
  options: { 
      encrypt: false, 
      trustServerCertificate: true 
  },
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

// MongoDB — OPTIONAL: không crash server nếu kết nối thất bại
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Atlas connected");
  } catch (err) {
    console.warn(
      "⚠️  MongoDB không kết nối được — các API analytics sẽ không hoạt động.",
    );
    console.warn("   Lý do:", err.message.split("\n")[0]);
    console.warn("   → Thử dùng hotspot điện thoại để fix.");
    // Không throw — server vẫn chạy bình thường với MS SQL
  }
};

const getMongoDb = () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB chưa kết nối");
  }
  return mongoose.connection.db;
};

module.exports = { connectSQL, connectMongo, getPool, getMongoDb, sql };
