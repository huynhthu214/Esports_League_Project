"""
fix_mongodb_data.py
===================
Chạy file này để sinh/bổ sung dữ liệu MongoDB cho project Esports League.

Những gì script này làm:
  1. Thêm field 'hero' vào tất cả documents đã có (patch)
  2. Giữ nguyên 101 documents hiện có, KHÔNG xóa
  3. Thêm ~80 trận cho mùa SS2025_2 (season Summer 2025)
  4. Thêm các đội còn thiếu: DNS, HPX, CTW, BHT, NTS, VTB, LAE, TNB
     với đầy đủ player_id khớp SQL

Cách chạy:
  pip install pymongo
  python fix_mongodb_data.py
"""

from pymongo import MongoClient
import random
from datetime import datetime, timedelta

# ── Kết nối ──────────────────────────────────────────────────────
URI = "mongodb+srv://esports_league:nhom09123@cluster0.mtn2vb1.mongodb.net/"
client = MongoClient(URI)
db = client["esports_league"]
col = db["match_stats"]

# ── Danh sách tướng (hero) ────────────────────────────────────────
HEROES = [
    "Raz", "Ngộ Không", "Tulen", "Yorn", "Arum",
    "Zata", "Wisp", "Laville", "Hayabusa", "Baldum",
    "Zip", "Liliana", "Grakk", "Qi", "Annette",
    "Butterfly", "Florentino", "Val", "Omen", "Xeniel",
]

# ── Tất cả đội + player_id (khớp SQL) ────────────────────────────
ALL_TEAMS = {
    "SGD": ["P001", "P002", "P003", "P004", "P005"],
    "HNL": ["P011", "P012", "P013", "P014", "P015"],
    "FLC": ["P021", "P022", "P023", "P024", "P025"],
    "TDT": ["P031", "P032", "P033", "P034", "P035"],
    "DNS": ["P041", "P042", "P043", "P044", "P045"],
    "HPX": ["P051", "P052", "P053", "P054", "P055"],
    "CTW": ["P061", "P062", "P063", "P064", "P065"],
    "BHT": ["P071", "P072", "P073", "P074", "P075"],
    "NTS": ["P081", "P082", "P083", "P084", "P085"],
    "VTB": ["P091", "P092", "P093", "P094", "P095"],
    "LAE": ["P101", "P102", "P103", "P104", "P105"],
    "TNB": ["P111", "P112", "P113", "P114", "P115"],
}

def make_player_stats(player_id, is_winner):
    """Sinh stats cho 1 player theo kết quả trận."""
    if is_winner:
        return {
            "player_id": player_id,
            "kills":   random.randint(5, 15),
            "deaths":  random.randint(0, 5),
            "assists": random.randint(5, 15),
            "gold":    random.randint(12000, 20000),
            "hero":    random.choice(HEROES),
        }
    else:
        return {
            "player_id": player_id,
            "kills":   random.randint(0, 7),
            "deaths":  random.randint(5, 14),
            "assists": random.randint(1, 10),
            "gold":    random.randint(7000, 13000),
            "hero":    random.choice(HEROES),
        }

def make_match(match_id, season_id, team1_id, team2_id, match_date):
    """Tạo 1 match document đầy đủ."""
    return {
        "match_id":   match_id,
        "season_id":  season_id,
        "match_date": match_date,
        "teams": [
            {
                "team_id": team1_id,
                "result":  "WIN",
                "score":   random.randint(2, 3),
                "players": [make_player_stats(p, True)  for p in ALL_TEAMS[team1_id]],
            },
            {
                "team_id": team2_id,
                "result":  "LOSS",
                "score":   random.randint(0, 1),
                "players": [make_player_stats(p, False) for p in ALL_TEAMS[team2_id]],
            },
        ],
    }

# ═══════════════════════════════════════════════════════════════════
# BƯỚC 1: Patch hero field vào tất cả documents hiện có chưa có hero
# ═══════════════════════════════════════════════════════════════════
print("🔧 Bước 1: Patch field 'hero' vào documents hiện có...")

docs_without_hero = list(col.find({"teams.players.hero": {"$exists": False}}))
patch_count = 0

for doc in docs_without_hero:
    new_teams = []
    for team in doc.get("teams", []):
        new_players = []
        for player in team.get("players", []):
            if "hero" not in player:
                player["hero"] = random.choice(HEROES)
            new_players.append(player)
        team["players"] = new_players
        new_teams.append(team)
    col.update_one({"_id": doc["_id"]}, {"$set": {"teams": new_teams}})
    patch_count += 1

print(f"   ✅ Đã patch hero cho {patch_count} documents.")

# ═══════════════════════════════════════════════════════════════════
# BƯỚC 2: Thêm trận đấu SS2025 cho 8 đội còn thiếu (DNS→TNB)
#         để các tuyển thủ P041–P115 có dữ liệu phân tích
# ═══════════════════════════════════════════════════════════════════
print("\n🔧 Bước 2: Thêm trận SS2025 cho các đội DNS, HPX, CTW, BHT, NTS, VTB, LAE, TNB...")

extra_teams   = ["DNS", "HPX", "CTW", "BHT", "NTS", "VTB", "LAE", "TNB"]
all_team_ids  = list(ALL_TEAMS.keys())

# Lấy match_id lớn nhất hiện có để tránh trùng
existing_ids = [d.get("match_id", "") for d in col.find({}, {"match_id": 1})]
ss2025_nums  = []
for mid in existing_ids:
    try:
        num = int(mid.split("_")[-1])
        ss2025_nums.append(num)
    except Exception:
        pass
next_num = (max(ss2025_nums) if ss2025_nums else 100) + 1

new_matches_ss2025 = []
base_date = datetime(2025, 1, 15)

for _ in range(60):  # 60 trận thêm cho SS2025
    # Ưu tiên các đội extra để họ có đủ dữ liệu
    t1 = random.choice(extra_teams)
    t2 = random.choice([x for x in all_team_ids if x != t1])
    match_date = base_date + timedelta(days=random.randint(0, 160))
    mid = f"M2025_{str(next_num).zfill(3)}"
    next_num += 1
    new_matches_ss2025.append(make_match(mid, "SS2025", t1, t2, match_date))

if new_matches_ss2025:
    col.insert_many(new_matches_ss2025)
    print(f"   ✅ Đã thêm {len(new_matches_ss2025)} trận SS2025.")

# ═══════════════════════════════════════════════════════════════════
# BƯỚC 3: Thêm trận đấu SS2025_2 (Summer Season — mùa ACTIVE)
#         Tất cả 12 đội, ~80 trận
# ═══════════════════════════════════════════════════════════════════
print("\n🔧 Bước 3: Thêm trận SS2025_2 (Summer Season)...")

# Kiểm tra xem đã có SS2025_2 chưa
existing_summer = col.count_documents({"season_id": "SS2025_2"})
if existing_summer > 0:
    print(f"   ⚠️  Đã có {existing_summer} trận SS2025_2, bỏ qua bước này.")
else:
    summer_matches = []
    summer_base    = datetime(2025, 6, 5)
    summer_num     = 1

    for _ in range(80):
        t1, t2 = random.sample(all_team_ids, 2)
        match_date = summer_base + timedelta(days=random.randint(0, 115))
        mid = f"MS2025_2_{str(summer_num).zfill(3)}"
        summer_num += 1
        summer_matches.append(make_match(mid, "SS2025_2", t1, t2, match_date))

    col.insert_many(summer_matches)
    print(f"   ✅ Đã thêm {len(summer_matches)} trận SS2025_2.")

# ═══════════════════════════════════════════════════════════════════
# KIỂM TRA KẾT QUẢ
# ═══════════════════════════════════════════════════════════════════
print("\nKiểm tra kết quả cuối:")
total = col.count_documents({})
ss2025_count    = col.count_documents({"season_id": "SS2025"})
ss2025_2_count  = col.count_documents({"season_id": "SS2025_2"})
hero_count      = col.count_documents({"teams.players.hero": {"$exists": True}})

print(f"   Tổng documents  : {total}")
print(f"   SS2025          : {ss2025_count} trận")
print(f"   SS2025_2        : {ss2025_2_count} trận")
print(f"   Có field 'hero' : {hero_count} documents")

# Kiểm tra 1 player cụ thể
p002_matches = col.count_documents({"teams.players.player_id": "P002"})
p042_matches = col.count_documents({"teams.players.player_id": "P042"})
print(f"\n   P002 (JungleKing/SGD) xuất hiện trong: {p002_matches} trận")
print(f"   P042 (StormJG/DNS)    xuất hiện trong: {p042_matches} trận")

print("\n✅ Hoàn tất! Khởi động lại backend để thấy hiệu lực.")
print("   node server.js")