// backend/controllers/matchController.js
const sql = require('mssql');
const { getMongoDb } = require('../config/db'); 

exports.submitMatchResult = async (req, res) => {
    const matchData = req.body; // JSON chứa cấu trúc trận đấu lồng nhau
    const mongoDb = getMongoDb();
    
    // Khởi tạo Transaction cho MS SQL
    const transaction = new sql.Transaction();

    try {
        // BƯỚC 1: LƯU VÀO MONGODB (NO-SQL)
        const insertResult = await mongoDb.collection('match_stats').insertOne(matchData);
        
        // BƯỚC 2: CẬP NHẬT MS SQL BẰNG TRANSACTION
        const winningTeam = matchData.teams.find(t => t.result === 'WIN').team_id;
        const losingTeam = matchData.teams.find(t => t.result === 'LOSS').team_id;

        await transaction.begin();
        const request = new sql.Request(transaction);

        // Update Đội Thắng
        await request.query(`
            UPDATE TeamStandings 
            SET Wins = Wins + 1 
            WHERE TeamID = '${winningTeam}' AND SeasonID = '${matchData.season_id}'
        `);

        // Update Đội Thua
        await request.query(`
            UPDATE TeamStandings 
            SET Losses = Losses + 1 
            WHERE TeamID = '${losingTeam}' AND SeasonID = '${matchData.season_id}'
        `);

        // NẾU SQL CHẠY TỐT -> CHỐT GIAO DỊCH
        await transaction.commit();
        res.status(200).json({ message: "Đồng bộ thành công kết quả vào Mongo và MS SQL!" });

    } catch (error) {
        console.error("Lỗi Dual-write:", error);
        
        // BƯỚC 3: XỬ LÝ LỖI (COMPENSATING TRANSACTION)
        if (transaction.isActive) {
            await transaction.rollback(); // Hoàn tác bên MS SQL
        }
        // Xóa document vừa lưu vào Mongo để giữ tính nhất quán
        if (matchData.match_id) {
            await mongoDb.collection('match_stats').deleteOne({ match_id: matchData.match_id });
        }

        res.status(500).json({ error: "Lỗi hệ thống, đã rollback toàn bộ giao dịch." });
    }
};