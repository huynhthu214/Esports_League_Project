const { sql, getMongoDb } = require('../config/db');

exports.submitMatchResult = async (req, res) => {
    const matchData = req.body; 
    // JSON giả định: { match_id, season_id, teams: [ { team_id: "GAM", result: "WIN", players: [...] }, { team_id: "SGB", result: "LOSS", players: [...] } ] }
    
    const mongoDb = getMongoDb();
    const transaction = new sql.Transaction();
    let mongoInsertedId = null;

    try {
        // ==========================================
        // BƯỚC 1: LƯU VÀO MONGODB (NoSQL) TRƯỚC
        // ==========================================
        const insertResult = await mongoDb.collection('match_stats').insertOne(matchData);
        mongoInsertedId = insertResult.insertedId;

        // Bóc tách ID đội thắng và đội thua từ JSON
        const winningTeam = matchData.teams.find(t => t.result === 'WIN')?.team_id;
        const losingTeam = matchData.teams.find(t => t.result === 'LOSS')?.team_id;

        if (!winningTeam || !losingTeam || !matchData.season_id) {
            throw new Error("Dữ liệu JSON không hợp lệ: Thiếu team WIN/LOSS hoặc season_id.");
        }

        // ==========================================
        // BƯỚC 2: CẬP NHẬT MS SQL BẰNG TRANSACTION
        // ==========================================
        await transaction.begin();
        const request = new sql.Request(transaction);

        // Khai báo biến an toàn (Parameterized Query) khớp với VARCHAR(10) trong SQL
        request.input('WinTeam', sql.VarChar, winningTeam);
        request.input('LoseTeam', sql.VarChar, losingTeam);
        request.input('SeasonId', sql.VarChar, matchData.season_id);

        // Update Đội Thắng (+1 Thắng)
        await request.query(`
            UPDATE TeamStandings 
            SET Wins = Wins + 1 
            WHERE TeamID = @WinTeam AND SeasonID = @SeasonId
        `);

        // Update Đội Thua (+1 Thua)
        await request.query(`
            UPDATE TeamStandings 
            SET Losses = Losses + 1 
            WHERE TeamID = @LoseTeam AND SeasonID = @SeasonId
        `);

        // NẾU TẤT CẢ THÀNH CÔNG -> CHỐT GIAO DỊCH SQL
        await transaction.commit();
        res.status(200).json({ message: "Đồng bộ thành công kết quả vào Mongo và MS SQL!" });

    } catch (error) {
        console.error("❌ Lỗi Dual-write:", error);
        
        // ==========================================
        // BƯỚC 3: XỬ LÝ LỖI (COMPENSATING TRANSACTION)
        // ==========================================
        // 3.1. Hoàn tác bên MS SQL nếu đang chạy dở
        if (transaction.isActive) {
            await transaction.rollback(); 
            console.log("🔄 Đã Rollback MS SQL.");
        }
        
        // 3.2. Xóa Document bên MongoDB vừa tạo để đồng bộ (Compensating)
        if (mongoInsertedId) {
            await mongoDb.collection('match_stats').deleteOne({ _id: mongoInsertedId });
            console.log("🗑️ Đã xóa log bên MongoDB do SQL thất bại.");
        }

        res.status(500).json({ error: error.message || "Lỗi hệ thống, đã rollback toàn bộ giao dịch." });
    }
};