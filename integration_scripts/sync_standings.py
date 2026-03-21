import os
import pymongo
import pyodbc
from dotenv import load_dotenv

# Nạp cấu hình từ file .env
load_dotenv()

# 1. Cấu hình MongoDB
MONGO_URI = os.getenv("MONGO_URI")
mongo_client = pymongo.MongoClient(MONGO_URI)
db_nosql = mongo_client["esports_league"]
match_stats_col = db_nosql["match_stats"]

# 2. Cấu hình MS SQL Server
MSSQL_SERVER = os.getenv("MSSQL_SERVER")
MSSQL_DATABASE = os.getenv("MSSQL_DATABASE")
MSSQL_USER = os.getenv("MSSQL_USER")
MSSQL_PASS = os.getenv("MSSQL_PASS")

def sync_data():
    try:
        print("Đang tổng hợp dữ liệu trận đấu từ MongoDB...")
        
        # Pipeline giữ nguyên
        pipeline = [
            { "$unwind": "$teams" },
            { "$group": {
                "_id": "$teams.team_id",
                "total_team_kills": { "$sum": { "$sum": "$teams.players.kills" } }
            }}
        ]
        
        team_stats = list(match_stats_col.aggregate(pipeline))
        print(f"Đã lấy thống kê của {len(team_stats)} đội. Đang kết nối MS SQL...")

        # Tạo chuỗi kết nối cho MS SQL (Dùng ODBC Driver 17)
        conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={MSSQL_SERVER};DATABASE={MSSQL_DATABASE};UID={MSSQL_USER};PWD={MSSQL_PASS}"
        connection = pyodbc.connect(conn_str)
        cursor = connection.cursor()

        # Cập nhật dữ liệu vào bảng SQL
        for team in team_stats:
            team_id = team['_id']
            total_kills = team['total_team_kills']
            
            # MS SQL dùng dấu ? để truyền tham số
            sql_update = """
                UPDATE TEAM_STANDINGS 
                SET TOTAL_KILLS = ? 
                WHERE TEAM_ID = ?
            """
            # Truyền tham số theo đúng thứ tự của dấu ?
            cursor.execute(sql_update, (total_kills, team_id))
            
        connection.commit()
        print("Đồng bộ dữ liệu sang MS SQL THÀNH CÔNG!")

    except Exception as e:
        print("Lỗi trong quá trình đồng bộ:", e)
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()
        mongo_client.close()

if __name__ == "__main__":
    sync_data()