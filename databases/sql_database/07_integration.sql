-- ============================================================
-- FILE: 07_INTEGRATION.sql (fixed syntax)
-- DBMS: SQL Server 2022
-- ============================================================
USE EsportsLeagueDB;
GO

-- ============================================================
-- SP 1: sp_ImportMatchFromMongoDB
-- ============================================================
CREATE OR ALTER PROCEDURE sp_ImportMatchFromMongoDB
    @MatchJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Bước 1: Parse header
        DECLARE @MatchID   VARCHAR(20), @SeasonID  VARCHAR(10),
                @MatchDate DATETIME,    @Venue     NVARCHAR(100),
                @Duration  INT,         @Format    VARCHAR(10);

        SELECT
            @MatchID   = JSON_VALUE(@MatchJSON, '$.match_id'),
            @SeasonID  = JSON_VALUE(@MatchJSON, '$.season_id'),
            @MatchDate = CAST(JSON_VALUE(@MatchJSON, '$.match_date') AS DATETIME),
            @Venue     = JSON_VALUE(@MatchJSON, '$.venue'),
            @Duration  = CAST(JSON_VALUE(@MatchJSON, '$.duration_minutes') AS INT),
            @Format    = ISNULL(JSON_VALUE(@MatchJSON, '$.format'), 'BO3');

        -- Kiểm tra trùng MatchID
        IF EXISTS (SELECT 1 FROM Matches WHERE MatchID = @MatchID)
        BEGIN
            RAISERROR(N'⚠️ Match đã tồn tại, bỏ qua.', 10, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Bước 2: Parse teams
        DECLARE @Team1ID VARCHAR(10), @Team2ID VARCHAR(10),
                @Team1Score INT,      @Team2Score INT,
                @WinnerTeamID VARCHAR(10);

        SELECT @Team1ID    = JSON_VALUE(t.value, '$.team_id'),
               @Team1Score = CAST(JSON_VALUE(t.value, '$.score') AS INT)
        FROM OPENJSON(@MatchJSON, '$.teams') t
        WHERE JSON_VALUE(t.value, '$.result') = 'WIN';

        SELECT @Team2ID    = JSON_VALUE(t.value, '$.team_id'),
               @Team2Score = CAST(JSON_VALUE(t.value, '$.score') AS INT)
        FROM OPENJSON(@MatchJSON, '$.teams') t
        WHERE JSON_VALUE(t.value, '$.result') = 'LOSS';

        SET @WinnerTeamID = @Team1ID;

        -- Bước 3: Tính MVP (KDA cao nhất)
        DECLARE @MVPPlayerID VARCHAR(10);
        SELECT TOP 1 @MVPPlayerID = player_id
        FROM (
            SELECT
                JSON_VALUE(p.value, '$.player_id') AS player_id,
                (CAST(JSON_VALUE(p.value, '$.kills')   AS FLOAT) +
                 CAST(JSON_VALUE(p.value, '$.assists') AS FLOAT)) /
                (CAST(JSON_VALUE(p.value, '$.deaths')  AS FLOAT) + 0.001) AS KDA
            FROM OPENJSON(@MatchJSON, '$.teams') AS t
            CROSS APPLY OPENJSON(t.value, '$.players') AS p
        ) stats
        ORDER BY KDA DESC;

        -- Bước 4: Insert Matches
        INSERT INTO Matches (MatchID, SeasonID, Team1ID, Team2ID, WinnerTeamID,
            Team1Score, Team2Score, MatchDate, Venue, Format,
            DurationMinutes, MVPPlayerID, MongoMatchRef)
        VALUES (@MatchID, @SeasonID, @Team1ID, @Team2ID, @WinnerTeamID,
            @Team1Score, @Team2Score, @MatchDate, @Venue, @Format,
            @Duration, @MVPPlayerID, @MatchID);

        -- Bước 5: Sync PlayerSeasonStats (MERGE)
        MERGE PlayerSeasonStats AS target
        USING (
            SELECT
                JSON_VALUE(p.value, '$.player_id')          AS PlayerID,
                JSON_VALUE(t.value, '$.team_id')            AS TeamID,
                @SeasonID                                   AS SeasonID,
                CAST(JSON_VALUE(p.value, '$.kills')   AS INT) AS Kills,
                CAST(JSON_VALUE(p.value, '$.deaths')  AS INT) AS Deaths,
                CAST(JSON_VALUE(p.value, '$.assists') AS INT) AS Assists,
                CAST(JSON_VALUE(p.value, '$.gold')    AS INT) AS Gold,
                CASE WHEN JSON_VALUE(t.value, '$.result') = 'WIN' THEN 1 ELSE 0 END AS IsWin,
                CASE WHEN CAST(JSON_VALUE(p.value, '$.deaths') AS FLOAT) = 0
                     THEN  CAST(JSON_VALUE(p.value, '$.kills')   AS FLOAT)
                          +CAST(JSON_VALUE(p.value, '$.assists') AS FLOAT)
                     ELSE (CAST(JSON_VALUE(p.value, '$.kills')   AS FLOAT)
                          +CAST(JSON_VALUE(p.value, '$.assists') AS FLOAT))
                          /CAST(JSON_VALUE(p.value, '$.deaths')  AS FLOAT)
                END AS KDA
            FROM OPENJSON(@MatchJSON, '$.teams') AS t
            CROSS APPLY OPENJSON(t.value, '$.players') AS p
            WHERE JSON_VALUE(p.value, '$.player_id') IS NOT NULL
        ) AS src
        ON (target.PlayerID = src.PlayerID AND target.SeasonID = src.SeasonID)

        WHEN MATCHED THEN UPDATE SET
            TotalMatches = target.TotalMatches + 1,
            TotalKills   = target.TotalKills   + src.Kills,
            TotalDeaths  = target.TotalDeaths  + src.Deaths,
            TotalAssists = target.TotalAssists + src.Assists,
            TotalGold    = target.TotalGold    + src.Gold,
            AvgKDA  = CAST((target.AvgKDA * target.TotalMatches + src.KDA)
                      / (target.TotalMatches + 1) AS DECIMAL(6,2)),
            AvgGPM  = CASE WHEN @Duration = 0 THEN target.AvgGPM
                      ELSE CAST((target.AvgGPM * target.TotalMatches
                                 + CAST(src.Gold AS DECIMAL) / @Duration)
                                / (target.TotalMatches + 1) AS DECIMAL(8,2)) END,
            WinRate = CAST((target.WinRate * target.TotalMatches + src.IsWin * 100.0)
                      / (target.TotalMatches + 1) AS DECIMAL(5,2)),
            TeamID       = src.TeamID,
            LastSyncedAt = GETDATE()

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (PlayerID, SeasonID, TeamID, TotalMatches,
                    TotalKills, TotalDeaths, TotalAssists, TotalGold,
                    AvgKDA, AvgGPM, WinRate, LastSyncedAt)
            VALUES (src.PlayerID, src.SeasonID, src.TeamID, 1,
                    src.Kills, src.Deaths, src.Assists, src.Gold,
                    CAST(src.KDA AS DECIMAL(6,2)),
                    CASE WHEN @Duration = 0 THEN 0
                         ELSE CAST(CAST(src.Gold AS DECIMAL) / @Duration AS DECIMAL(8,2)) END,
                    src.IsWin * 100.0,
                    GETDATE());

        -- Bước 6: COMMIT
        COMMIT TRANSACTION;

        SELECT
            @MatchID      AS MatchID,
            wt.TeamName   AS Winner,
            @Team1Score   AS WinnerScore,
            @Team2Score   AS LoserScore,
            mv.Nickname   AS MVP,
            N'✅ Import thành công' AS Status
        FROM Teams wt, Players mv
        WHERE wt.TeamID   = @WinnerTeamID
          AND mv.PlayerID = @MVPPlayerID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Err1Msg NVARCHAR(2048) = ERROR_MESSAGE();
        DECLARE @Err1Sev INT            = ERROR_SEVERITY();
        RAISERROR(@Err1Msg, @Err1Sev, 1);
    END CATCH;
END;
GO

-- ============================================================
-- SP 2: sp_SyncStandingsFromMongo
-- ============================================================
CREATE OR ALTER PROCEDURE sp_SyncStandingsFromMongo
    @StandingsJSON NVARCHAR(MAX)
-- JSON: [{"season_id":"SS2025","team_id":"SGD","wins":7,"losses":0,"win_rate":100.0}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        MERGE TeamStandings AS target
        USING (
            SELECT
                JSON_VALUE(s.value, '$.season_id')                       AS SeasonID,
                JSON_VALUE(s.value, '$.team_id')                         AS TeamID,
                CAST(JSON_VALUE(s.value, '$.wins')     AS INT)           AS Wins,
                CAST(JSON_VALUE(s.value, '$.losses')   AS INT)           AS Losses,
                CAST(JSON_VALUE(s.value, '$.win_rate') AS DECIMAL(5,2))  AS WinRate
            FROM OPENJSON(@StandingsJSON) s
        ) AS src
        ON (target.SeasonID = src.SeasonID AND target.TeamID = src.TeamID)

        WHEN MATCHED THEN UPDATE SET
            Wins        = src.Wins,
            Losses      = src.Losses,
            WinRate     = src.WinRate,
            Points      = src.Wins * 3,
            LastUpdated = GETDATE()

        WHEN NOT MATCHED THEN
            INSERT (SeasonID, TeamID, Wins, Losses, WinRate, Points)
            VALUES (src.SeasonID, src.TeamID, src.Wins, src.Losses, src.WinRate, src.Wins * 3);

        COMMIT TRANSACTION;
        PRINT N'✅ Sync standings thành công: ' + CAST(@@ROWCOUNT AS VARCHAR) + ' rows.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Err2Msg NVARCHAR(2048) = ERROR_MESSAGE();
        DECLARE @Err2Sev INT            = ERROR_SEVERITY();
        RAISERROR(@Err2Msg, @Err2Sev, 1);
    END CATCH;
END;
GO

-- ============================================================
-- TEST 1: Import trận đấu SGD vs HNL
-- ============================================================
PRINT '=== TEST 1: Import match từ MongoDB JSON ===';
BEGIN TRY
    EXEC sp_ImportMatchFromMongoDB @MatchJSON = N'{
        "match_id":         "M2025_099",
        "season_id":        "SS2025",
        "match_date":       "2025-05-15T14:00:00",
        "venue":            "Arena SGD",
        "duration_minutes": 88,
        "format":           "BO3",
        "teams": [
            {
                "team_id": "SGD", "result": "WIN", "score": 2,
                "players": [
                    {"player_id":"P001","kills":5, "deaths":2,"assists":8, "gold":12500},
                    {"player_id":"P002","kills":10,"deaths":1,"assists":14,"gold":15200},
                    {"player_id":"P004","kills":7, "deaths":3,"assists":9, "gold":13100},
                    {"player_id":"P005","kills":1, "deaths":4,"assists":15,"gold":9800},
                    {"player_id":"P006","kills":4, "deaths":2,"assists":11,"gold":11200}
                ]
            },
            {
                "team_id": "HNL", "result": "LOSS", "score": 1,
                "players": [
                    {"player_id":"P011","kills":8,"deaths":5,"assists":10,"gold":12800},
                    {"player_id":"P012","kills":4,"deaths":4,"assists":7, "gold":10500},
                    {"player_id":"P013","kills":6,"deaths":5,"assists":8, "gold":11200},
                    {"player_id":"P014","kills":5,"deaths":5,"assists":6, "gold":10900},
                    {"player_id":"P015","kills":2,"deaths":4,"assists":12,"gold":9100}
                ]
            }
        ]
    }';
END TRY
BEGIN CATCH
    PRINT '❌ TEST 1 FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- TEST 2: Import trùng MatchID (phải bị chặn)
-- ============================================================
PRINT '';
PRINT '=== TEST 2: Import trùng MatchID (phải bị chặn) ===';
BEGIN TRY
    EXEC sp_ImportMatchFromMongoDB @MatchJSON = N'{
        "match_id": "M2025_099",
        "season_id": "SS2025",
        "match_date": "2025-05-15T14:00:00",
        "duration_minutes": 88,
        "teams": [
            {"team_id":"SGD","result":"WIN","score":2,"players":[
                {"player_id":"P001","kills":5,"deaths":2,"assists":8,"gold":12500}
            ]},
            {"team_id":"HNL","result":"LOSS","score":1,"players":[
                {"player_id":"P011","kills":3,"deaths":5,"assists":4,"gold":9000}
            ]}
        ]
    }';
END TRY
BEGIN CATCH
    PRINT '✅ EXPECTED: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- TEST 3: Sync standings từ MongoDB
-- ============================================================
PRINT '';
PRINT '=== TEST 3: Sync standings từ MongoDB ===';
BEGIN TRY
    EXEC sp_SyncStandingsFromMongo @StandingsJSON = N'[
        {"season_id":"SS2025","team_id":"SGD","wins":8,"losses":0,"win_rate":100.0},
        {"season_id":"SS2025","team_id":"HNL","wins":5,"losses":3,"win_rate":62.5},
        {"season_id":"SS2025","team_id":"FLC","wins":4,"losses":3,"win_rate":57.1},
        {"season_id":"SS2025","team_id":"TDT","wins":3,"losses":4,"win_rate":42.9}
    ]';
END TRY
BEGIN CATCH
    PRINT '❌ TEST 3 FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== Kiểm tra kết quả sau import + sync ===';
SELECT MatchID, Team1ID, Team2ID, Team1Score, Team2Score, MVPPlayerID
FROM Matches WHERE MatchID = 'M2025_099';

SELECT
    DENSE_RANK() OVER (ORDER BY Wins DESC, WinRate DESC) AS Rank,
    TeamID, Wins, Losses, WinRate
FROM TeamStandings WHERE SeasonID = 'SS2025'
ORDER BY Rank;
GO

PRINT '============================================================';
PRINT '✅ 07_INTEGRATION.sql hoàn tất!';
PRINT '============================================================';
GO