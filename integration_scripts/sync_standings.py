"""
FILE: sync_standings.py
MUC DICH: Dong bo du lieu tong hop tu MongoDB -> MS SQL Server
"""

import os
import pymongo
import pyodbc
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = pymongo.MongoClient(MONGO_URI)
db_nosql = mongo_client["esports_league"]
match_col = db_nosql["match_stats"]

conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={os.getenv('MSSQL_SERVER')};"
    f"DATABASE={os.getenv('MSSQL_DATABASE')};"
    f"UID={os.getenv('MSSQL_USER')};"
    f"PWD={os.getenv('MSSQL_PASS')}"
)


def build_player_stats_pipeline(season_id: str) -> list:
    return [
        {"$match": {"season_id": season_id}},
        {"$unwind": "$teams"},
        {"$unwind": "$teams.players"},
        {
            "$addFields": {
                "teams.players.kda": {
                    "$divide": [
                        {"$add": ["$teams.players.kills", "$teams.players.assists"]},
                        {"$max": ["$teams.players.deaths", 1]},
                    ]
                },
                "teams.players.gpm": {
                    "$cond": {
                        "if":   {"$gt": ["$duration_minutes", 0]},
                        "then": {"$divide": ["$teams.players.gold", "$duration_minutes"]},
                        "else": 0,
                    }
                },
                "is_win": {
                    "$cond": {"if": {"$eq": ["$teams.result", "WIN"]}, "then": 1, "else": 0}
                },
                "team_id": "$teams.team_id",
            }
        },
        {
            "$group": {
                "_id": {
                    "player_id": "$teams.players.player_id",
                    "season_id": "$season_id",
                    "team_id":   "$team_id",
                },
                "total_matches":  {"$sum": 1},
                "total_kills":    {"$sum": "$teams.players.kills"},
                "total_deaths":   {"$sum": "$teams.players.deaths"},
                "total_assists":  {"$sum": "$teams.players.assists"},
                "total_gold":     {"$sum": "$teams.players.gold"},
                "avg_kda":        {"$avg": "$teams.players.kda"},
                "avg_gpm":        {"$avg": "$teams.players.gpm"},
                "total_wins":     {"$sum": "$is_win"},
            }
        },
        {
            "$addFields": {
                "win_rate": {
                    "$round": [
                        {"$multiply": [
                            {"$divide": ["$total_wins", {"$max": ["$total_matches", 1]}]},
                            100,
                        ]},
                        2,
                    ]
                },
                "avg_kda": {"$round": ["$avg_kda", 2]},
                "avg_gpm": {"$round": ["$avg_gpm", 2]},
            }
        },
    ]


def sync_player_season_stats(season_id: str = "SS2025"):
    connection = None
    cursor = None
    try:
        print(f"[1/4] Dang chay aggregation pipeline MongoDB cho season {season_id}...")
        pipeline = build_player_stats_pipeline(season_id)
        player_stats = list(match_col.aggregate(pipeline))
        print(f"      OK Tong hop xong {len(player_stats)} player records.")

        if not player_stats:
            print("      WARN Khong co du lieu de sync.")
            return

        print("[2/4] Dang ket noi MS SQL Server...")
        connection = pyodbc.connect(conn_str)
        cursor = connection.cursor()
        print("      OK Ket noi thanh cong.")

        print("[3/4] Kiem tra bang PlayerSeasonStats...")
        cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PlayerSeasonStats'")
        print("      OK Bang san sang.")

        upsert_sql = """
            MERGE PlayerSeasonStats AS target
            USING (VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)) AS source
                (PlayerID, SeasonID, TeamID, TotalMatches,
                 TotalKills, TotalDeaths, TotalAssists, TotalGold,
                 AvgKDA, AvgGPM, WinRate)
            ON target.PlayerID = source.PlayerID
               AND target.SeasonID = source.SeasonID
            WHEN MATCHED THEN
                UPDATE SET
                    TotalMatches  = source.TotalMatches,
                    TotalKills    = source.TotalKills,
                    TotalDeaths   = source.TotalDeaths,
                    TotalAssists  = source.TotalAssists,
                    TotalGold     = source.TotalGold,
                    AvgKDA        = source.AvgKDA,
                    AvgGPM        = source.AvgGPM,
                    WinRate       = source.WinRate,
                    LastSyncedAt  = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (PlayerID, SeasonID, TeamID, TotalMatches,
                        TotalKills, TotalDeaths, TotalAssists, TotalGold,
                        AvgKDA, AvgGPM, WinRate)
                VALUES (source.PlayerID, source.SeasonID, source.TeamID,
                        source.TotalMatches, source.TotalKills, source.TotalDeaths,
                        source.TotalAssists, source.TotalGold,
                        source.AvgKDA, source.AvgGPM, source.WinRate);
        """

        print(f"[4/4] Dang upsert {len(player_stats)} records vao SQL...")
        success_count = 0
        for rec in player_stats:
            pid     = rec["_id"]["player_id"]
            sid     = rec["_id"]["season_id"]
            tid     = rec["_id"]["team_id"]
            try:
                cursor.execute(upsert_sql, (
                    pid, sid, tid,
                    int(rec.get("total_matches", 0)),
                    int(rec.get("total_kills",   0)),
                    int(rec.get("total_deaths",  0)),
                    int(rec.get("total_assists", 0)),
                    int(rec.get("total_gold",    0)),
                    float(rec.get("avg_kda",  0)),
                    float(rec.get("avg_gpm",  0)),
                    float(rec.get("win_rate", 0)),
                ))
                success_count += 1
            except Exception as row_err:
                print(f"      WARN Bo qua {pid}/{sid}: {row_err}")

        connection.commit()
        print(f"      OK Upsert thanh cong {success_count}/{len(player_stats)} records.")
        print("\nSync hoan tat! Polyglot Persistence: raw data o MongoDB -> summary o SQL.")

    except Exception as e:
        print(f"\nLoi sync: {e}")
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