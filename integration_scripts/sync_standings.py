import pymongo
import oracledb

# 1. Cấu hình kết nối MongoDB Atlas (Dùng chuỗi kết nối đã lách luật SRV của bạn)
MONGO_URI = "mongodb://esports_league:nhom09123@cluster0-shard-00-00.mtn2vb1.mongodb.net:27017,cluster0-shard-00-01.mtn2vb1.mongodb.net:27017,cluster0-shard-00-02.mtn2vb1.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority"
mongo_client = pymongo.MongoClient(MONGO_URI)
db_nosql = mongo_client["esports_league"]
match_stats_col = db_nosql["match_stats"]

# 2. Cấu hình kết nối Oracle SQL (Hỏi Thành viên 1 thông tin này)
ORACLE_USER = "system" # Tên đăng nhập Oracle
ORACLE_PASS = "oracle_password" # Mật khẩu Oracle
ORACLE_DSN = "localhost:1521/XEPDB1" # Địa chỉ Database của TV1

def sync_data():
    try:
        print("Đang tổng hợp dữ liệu trận đấu từ MongoDB...")
        
        # Pipeline: Tính tổng số mạng hạ gục của mỗi đội để làm điểm xếp hạng (Ví dụ)
        pipeline = [
            { "$unwind": "$teams" },
            { "$group": {
                "_id": "$teams.team_id",
                "total_team_kills": { "$sum": { "$sum": "$teams.players.kills" } }
            }}
        ]
        
        team_stats = list(match_stats_col.aggregate(pipeline))
        print(f"Đã lấy thống kê của {len(team_stats)} đội. Đang kết nối Oracle...")

        # Kết nối vào Oracle Database
        connection = oracledb.connect(user=ORACLE_USER, password=ORACLE_PASS, dsn=ORACLE_DSN)
        cursor = connection.cursor()

        # Cập nhật dữ liệu vào bảng SQL của TV1 (Giả sử bảng tên là TEAM_STANDINGS)
        for team in team_stats:
            team_id = team['_id']
            total_kills = team['total_team_kills']
            
            # Lệnh UPDATE SQL (TV1 cần đảm bảo bảng này đã tồn tại)
            sql_update = """
                UPDATE TEAM_STANDINGS 
                SET TOTAL_KILLS = :kills 
                WHERE TEAM_ID = :t_id
            """
            cursor.execute(sql_update, kills=total_kills, t_id=team_id)
            
        connection.commit()
        print("Đồng bộ dữ liệu sang Oracle SQL THÀNH CÔNG!")

    except Exception as e:
        print("Lỗi trong quá trình đồng bộ:", e)
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()
        mongo_client.close()

if __name__ == "__main__":
    sync_data()