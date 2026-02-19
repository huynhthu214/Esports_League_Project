from pymongo import MongoClient
import random
from datetime import datetime, timedelta

# 1. KẾT NỐI TỚI MONGODB ATLAS CỦA BẠN
uri = "mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/"
client = MongoClient(uri)
db = client['esports_league']
collection = db['match_stats']

# 2. KHỞI TẠO DỮ LIỆU DANH SÁCH ĐỘI VÀ TUYỂN THỦ (Mỗi đội 5 người)
# Lưu ý: ID này sau này có thể báo Thành viên 1 cập nhật vào SQL cho khớp
teams_data = {
    "SGD": ["P001", "P002", "P003", "P004", "P005"],
    "HNL": ["P011", "P012", "P013", "P014", "P015"],
    "FLC": ["P021", "P022", "P023", "P024", "P025"],
    "TDT": ["P031", "P032", "P033", "P034", "P035"]
}
team_ids = list(teams_data.keys())

matches = []

# 3. VÒNG LẶP SINH 100 TRẬN ĐẤU
for i in range(1, 101):
    # Chọn ngẫu nhiên 2 đội khác nhau thi đấu
    team1, team2 = random.sample(team_ids, 2)
    
    # Random ngày thi đấu trong vòng 60 ngày qua
    match_date = datetime.utcnow() - timedelta(days=random.randint(0, 60))
    
    match = {
        "match_id": f"M2025_{str(i).zfill(3)}",
        "season_id": "SS2025",
        "match_date": match_date,
        "teams": [
            {
                "team_id": team1,
                "result": "WIN",
                "score": random.randint(2, 3),
                "players": [
                    {
                        "player_id": p_id,
                        "kills": random.randint(5, 15),
                        "deaths": random.randint(0, 7),
                        "assists": random.randint(5, 15),
                        "gold": random.randint(12000, 20000)
                    } for p_id in teams_data[team1]
                ]
            },
            {
                "team_id": team2,
                "result": "LOSS",
                "score": random.randint(0, 1),
                "players": [
                    {
                        "player_id": p_id,
                        "kills": random.randint(0, 7),
                        "deaths": random.randint(5, 15),
                        "assists": random.randint(1, 10),
                        "gold": random.randint(8000, 13000)
                    } for p_id in teams_data[team2]
                ]
            }
        ]
    }
    matches.append(match)

# 4. XÓA DỮ LIỆU CŨ VÀ INSERT 100 TRẬN MỚI VÀO DATABASE
collection.delete_many({}) # Xóa document nháp bạn vừa tạo lúc nãy
collection.insert_many(matches)

print("Đã tạo và đẩy thành công 100 trận đấu lên MongoDB Atlas!")