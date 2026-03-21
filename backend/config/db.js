// backend/config/db.js
const sql = require('mssql');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cấu hình MS SQL
const sqlConfig = {
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD || 'YourPassword123',
    database: process.env.SQL_DATABASE || 'EsportsLeague',
    server: process.env.SQL_SERVER || 'localhost',
    options: { encrypt: false, trustServerCertificate: true } 
};

// Cấu hình MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb:mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/';
const mongoClient = new MongoClient(mongoUri);
let mongoDb;

const connectDB = async () => {
    try {
        // Kết nối MS SQL
        await sql.connect(sqlConfig);
        console.log('✅ Đã kết nối MS SQL Server!');

        // Kết nối MongoDB
        await mongoClient.connect();
        mongoDb = mongoClient.db('esports_league');
        console.log('✅ Đã kết nối MongoDB!');
    } catch (err) {
        console.error('❌ Lỗi kết nối Database:', err);
        process.exit(1);
    }
};

const getMongoDb = () => mongoDb;

module.exports = { connectDB, sql, getMongoDb };