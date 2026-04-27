"""
FILE: sync_standings.py
MỤC ĐÍCH: Đồng bộ dữ liệu tổng hợp từ MongoDB → MS SQL Server
NÂNG CẤP: Tính đầy đủ AvgKDA, AvgGPM, WinRate theo TỪNG PLAYER
          rồi upsert vào bảng PlayerSeasonStats trong SQL.
          → Minh chứng Polyglot Persistence: raw ở MongoDB, summary ở SQL.
"""

import os
import pymongo
import pyodbc
from dotenv import load_dotenv

load_dotenv()

# ── Kết nối MongoDB ──────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")
mongo_client = pymongo.MongoClient(MONGO_URI)
db_nosql = mongo_client["esports_league"]
match_col = db_nosql["match_stats"]

# ── Kết nối MS SQL Server ────────────────────────────────────────────────────
conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={os.getenv('MSSQL_SERVER')};"
    f"DATABASE={os.getenv('MSSQL_DATABASE')};"
    f"UID={os.getenv('MSSQL_USER')};"
    f"PWD={os.getenv('MSSQL_PASS')}"
)

# ── Pipeline tổng hợp chỉ số theo TỪNG PLAYER trong một season ──────────────
def build_player_stats_pipeline(season_id: str) -> list:
    """
    Trả về aggregation pipeline tính AvgKDA, AvgGPM, WinRate, TotalMatches
    cho tất cả player trong season_id được chỉ định.
    """
    return [
        # Lọc theo season
        {"$match": {"season_id": season_id}},

        # Tách từng team trong trận
        {"$unwind": "$teams"},

        # Tách từng player trong team — đây là $unwind "đúng cách" cho nested document
        {"$unwind": "$teams.players"},

        # Tính KDA động và GPM ngay trong pipeline
        {
            "$addFields": {
                "teams.players.kda": {
                    "$divide": [
                        {"$add": ["$teams.players.kills", "$teams.players.assists"]},
                        {"$max": ["$teams.players.deaths", 1]},  # tránh chia 0
                    ]
                },
                "teams.players.gpm": {
                    "$cond": {
                        "if":   {"$gt": ["$duration_minutes", 0]},
                        "then": {"$divide": ["$teams.players.gold", "$duration_minutes"]},
                        "else": 0,
                    }
                },
                # 1 nếu đội của player thắng, 0 nếu thua
                "is_win": {
                    "$cond": {"if": {"$eq": ["$teams.result", "WIN"]}, "then": 1, "else": 0}
                },
            }
        },

        # Gom nhóm theo player + season để tính các chỉ số tổng hợp
        {
            "$group": {
                "_id": {
                    "player_id": "$teams.players.player_id",
                    "season_id": "$season_id",
                },
                "avg_kills":   {"$avg": "$teams.players.kills"},
                "avg_deaths":  {"$avg": "$teams.players.deaths"},
                "avg_assists": {"$avg": "$teams.players.assists"},
                "avg_gold":    {"$avg": "$teams.players.gold"},
                "avg_kda":     {"$avg": "$teams.players.kda"},
                "avg_gpm":     {"$avg": "$teams.players.gpm"},
                "total_wins":  {"$sum": "$is_win"},
                "total_matches": {"$sum": 1},
            }
        },

        # Tính WinRate sau khi đã có tổng wins và matches
        {
            "$addFields": {
                "win_rate": {
                    "$round": [
                        {
                            "$multiply": [
                                {"$divide": ["$total_wins", {"$max": ["$total_matches", 1]}]},
                                100,
                            ]
                        },
                        2,
                    ]
                },
                "avg_kda": {"$round": ["$avg_kda", 3]},
                "avg_gpm": {"$round": ["$avg_gpm", 1]},
            }
        },
    ]


def sync_player_season_stats(season_id: str = "SS2025"):
    """
    Hàm chính: chạy pipeline MongoDB → upsert vào PlayerSeasonStats trong SQL.
    """
    connection = None
    cursor = None
    try:
        print(f"[1/4] Đang chạy aggregation pipeline MongoDB cho season {season_id}...")
        pipeline = build_player_stats_pipeline(season_id)
        player_stats = list(match_col.aggregate(pipeline))
        print(f"      ✅ Tổng hợp xong {len(player_stats)} player records.")

        if not player_stats:
            print("      ⚠️  Không có dữ liệu để sync.")
            return

        print("[2/4] Đang kết nối MS SQL Server...")
        connection = pyodbc.connect(conn_str)
        cursor = connection.cursor()
        print("      ✅ Kết nối thành công.")

        # Đảm bảo bảng tồn tại (idempotent)
        print("[3/4] Đảm bảo bảng PlayerSeasonStats tồn tại...")
        cursor.execute("""
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'PlayerSeasonStats'
            )
            CREATE TABLE PlayerSeasonStats (
                PlayerID      VARCHAR(10)   NOT NULL,
                SeasonID      VARCHAR(10)   NOT NULL,
                TotalMatches  INT           DEFAULT 0,
                TotalWins     INT           DEFAULT 0,
                WinRate       DECIMAL(5,2)  DEFAULT 0,
                AvgKDA        DECIMAL(8,3)  DEFAULT 0,
                AvgKills      DECIMAL(6,2)  DEFAULT 0,
                AvgDeaths     DECIMAL(6,2)  DEFAULT 0,
                AvgAssists    DECIMAL(6,2)  DEFAULT 0,
                AvgGPM        DECIMAL(8,1)  DEFAULT 0,
                LastSyncedAt  DATETIME      DEFAULT GETDATE(),
                PRIMARY KEY (PlayerID, SeasonID)
            )
        """)
        connection.commit()
        print("      ✅ Bảng sẵn sàng.")

        # UPSERT từng player record
        print(f"[4/4] Đang upsert {len(player_stats)} records vào SQL...")

        upsert_sql = """
            MERGE PlayerSeasonStats AS target
            USING (VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)) AS source
                (PlayerID, SeasonID, TotalMatches, TotalWins, WinRate,
                 AvgKDA, AvgKills, AvgDeaths, AvgAssists, AvgGPM)
            ON target.PlayerID = source.PlayerID AND target.SeasonID = source.SeasonID
            WHEN MATCHED THEN
                UPDATE SET
                    TotalMatches = source.TotalMatches,
                    TotalWins    = source.TotalWins,
                    WinRate      = source.WinRate,
                    AvgKDA       = source.AvgKDA,
                    AvgKills     = source.AvgKills,
                    AvgDeaths    = source.AvgDeaths,
                    AvgAssists   = source.AvgAssists,
                    AvgGPM       = source.AvgGPM,
                    LastSyncedAt = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (PlayerID, SeasonID, TotalMatches, TotalWins, WinRate,
                        AvgKDA, AvgKills, AvgDeaths, AvgAssists, AvgGPM)
                VALUES (source.PlayerID, source.SeasonID, source.TotalMatches,
                        source.TotalWins, source.WinRate, source.AvgKDA,
                        source.AvgKills, source.AvgDeaths, source.AvgAssists,
                        source.AvgGPM);
        """

        success_count = 0
        for rec in player_stats:
            pid = rec["_id"]["player_id"]
            sid = rec["_id"]["season_id"]
            try:
                cursor.execute(upsert_sql, (
                    pid, sid,
                    int(rec.get("total_matches", 0)),
                    int(rec.get("total_wins", 0)),
                    float(rec.get("win_rate", 0)),
                    float(rec.get("avg_kda", 0)),
                    float(rec.get("avg_kills", 0)),
                    float(rec.get("avg_deaths", 0)),
                    float(rec.get("avg_assists", 0)),
                    float(rec.get("avg_gpm", 0)),
                ))
                success_count += 1
            except Exception as row_err:
                print(f"      ⚠️  Bỏ qua {pid}/{sid}: {row_err}")

        connection.commit()
        print(f"      ✅ Upsert thành công {success_count}/{len(player_stats)} records.")
        print("\n🎉 Sync hoàn tất! Polyglot Persistence: raw data ở MongoDB → summary ở SQL.")

    except Exception as e:
        print(f"\n❌ Lỗi sync: {e}")
        if connection:
            connection.rollback()

    finally:
        if cursor:     cursor.close()
        if connection: connection.close()
        mongo_client.close()


if __name__ == "__main__":
    import sys
    season = sys.argv[1] if len(sys.argv) > 1 else "SS2025"
    sync_player_season_stats(season)
