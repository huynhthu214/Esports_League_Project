-- ============================================================
-- FILE: 05_VIEWS.sql (đã fix SeasonID)
-- DBMS: SQL Server 2022
-- ============================================================
USE EsportsLeagueDB;
GO

-- VIEW 1: vw_Leaderboard_KDA - DENSE_RANK Window Function
CREATE OR ALTER VIEW vw_Leaderboard_KDA AS
SELECT
    DENSE_RANK() OVER (PARTITION BY pss.SeasonID ORDER BY pss.AvgKDA DESC) AS KDA_Rank,
    p.PlayerID, p.Nickname, p.Position,
    t.TeamName, t.ShortName AS TeamShort,
    s.SeasonName, pss.SeasonID,
    pss.TotalMatches, pss.TotalKills, pss.TotalDeaths, pss.TotalAssists,
    CAST(CASE WHEN pss.TotalDeaths = 0
         THEN (pss.TotalKills + pss.TotalAssists) * 1.0
         ELSE (pss.TotalKills + pss.TotalAssists) * 1.0 / pss.TotalDeaths
    END AS DECIMAL(6,2))                                          AS KDA_Calculated,
    pss.AvgKDA, pss.AvgGPM, pss.WinRate,
    DENSE_RANK() OVER (PARTITION BY pss.SeasonID, p.Position ORDER BY pss.AvgKDA DESC) AS Position_Rank,
    DENSE_RANK() OVER (PARTITION BY pss.SeasonID ORDER BY pss.AvgGPM DESC)             AS GPM_Rank,
    CASE WHEN pss.TotalMatches >= 5
         THEN DENSE_RANK() OVER (PARTITION BY pss.SeasonID ORDER BY pss.WinRate DESC)
         ELSE NULL END                                            AS WinRate_Rank
FROM PlayerSeasonStats pss
JOIN Players p ON p.PlayerID = pss.PlayerID
JOIN Teams   t ON t.TeamID   = pss.TeamID
JOIN Seasons s ON s.SeasonID = pss.SeasonID
WHERE pss.TotalMatches >= 5;
GO

-- VIEW 2: vw_TeamStandings - Bảng xếp hạng đội
CREATE OR ALTER VIEW vw_TeamStandings AS
SELECT
    DENSE_RANK() OVER (
        PARTITION BY ts.SeasonID
        ORDER BY ts.Wins DESC, ts.WinRate DESC, ts.GoalDiff DESC
    )                AS Standing_Rank,
    t.TeamID, t.TeamName, t.ShortName,
    s.SeasonID, s.SeasonName, s.Status AS SeasonStatus,
    ts.Wins, ts.Losses,
    (ts.Wins + ts.Losses) AS TotalMatches,
    ts.Points, ts.WinRate, ts.GoalDiff, ts.LastUpdated,
    CASE WHEN (ts.Wins + ts.Losses) = 0 THEN 0
         ELSE CAST(ts.Points AS DECIMAL(6,2)) / (ts.Wins + ts.Losses)
    END AS AvgPointsPerMatch
FROM TeamStandings ts
JOIN Teams   t ON t.TeamID   = ts.TeamID
JOIN Seasons s ON s.SeasonID = ts.SeasonID;
GO

-- VIEW 3: vw_PlayerSeasonSummary - Tổng hợp tuyển thủ theo mùa
CREATE OR ALTER VIEW vw_PlayerSeasonSummary AS
SELECT
    p.PlayerID, p.Nickname, p.FullName, p.Position, p.Nationality,
    t.TeamID, t.TeamName, t.ShortName AS TeamShort,
    s.SeasonID, s.SeasonName, s.Status AS SeasonStatus,
    r.JoinDate, r.LeaveDate, r.Status AS RosterStatus,
    ISNULL(pss.TotalMatches,0) AS TotalMatches,
    ISNULL(pss.AvgKDA,0)       AS AvgKDA,
    ISNULL(pss.AvgGPM,0)       AS AvgGPM,
    ISNULL(pss.WinRate,0)      AS WinRate,
    ISNULL(pss.TotalKills,0)   AS TotalKills,
    ISNULL(pss.TotalDeaths,0)  AS TotalDeaths,
    ISNULL(pss.TotalAssists,0) AS TotalAssists,
    (SELECT COUNT(*) FROM Matches m
     WHERE m.MVPPlayerID = p.PlayerID AND m.SeasonID = s.SeasonID) AS MVPCount,
    DENSE_RANK() OVER (
        PARTITION BY s.SeasonID ORDER BY ISNULL(pss.AvgKDA,0) DESC
    ) AS SeasonKDA_Rank
FROM Rosters r
JOIN Players p ON p.PlayerID = r.PlayerID
JOIN Teams   t ON t.TeamID   = r.TeamID
JOIN Seasons s ON s.SeasonID = r.SeasonID
LEFT JOIN PlayerSeasonStats pss ON pss.PlayerID = r.PlayerID AND pss.SeasonID = r.SeasonID;
GO

-- VIEW 4: vw_HeadToHead - Đối đầu trực tiếp
CREATE OR ALTER VIEW vw_HeadToHead AS
SELECT
    m.SeasonID, s.SeasonName,
    CASE WHEN m.Team1ID < m.Team2ID THEN m.Team1ID ELSE m.Team2ID END AS TeamA_ID,
    CASE WHEN m.Team1ID < m.Team2ID THEN m.Team2ID ELSE m.Team1ID END AS TeamB_ID,
    ta.TeamName AS TeamA_Name, tb.TeamName AS TeamB_Name,
    COUNT(*) AS TotalMatches,
    SUM(CASE WHEN m.WinnerTeamID = CASE WHEN m.Team1ID < m.Team2ID THEN m.Team1ID ELSE m.Team2ID END THEN 1 ELSE 0 END) AS TeamA_Wins,
    SUM(CASE WHEN m.WinnerTeamID = CASE WHEN m.Team1ID < m.Team2ID THEN m.Team2ID ELSE m.Team1ID END THEN 1 ELSE 0 END) AS TeamB_Wins,
    MAX(m.MatchDate) AS LastMatchDate
FROM Matches m
JOIN Seasons s ON s.SeasonID = m.SeasonID
JOIN Teams ta ON ta.TeamID = CASE WHEN m.Team1ID < m.Team2ID THEN m.Team1ID ELSE m.Team2ID END
JOIN Teams tb ON tb.TeamID = CASE WHEN m.Team1ID < m.Team2ID THEN m.Team2ID ELSE m.Team1ID END
WHERE m.WinnerTeamID IS NOT NULL
GROUP BY m.SeasonID, s.SeasonName,
    CASE WHEN m.Team1ID < m.Team2ID THEN m.Team1ID ELSE m.Team2ID END,
    CASE WHEN m.Team1ID < m.Team2ID THEN m.Team2ID ELSE m.Team1ID END,
    ta.TeamName, tb.TeamName;
GO

-- ============================================================
-- KIỂM TRA (dùng SS2025)
-- ============================================================
PRINT '=== Leaderboard KDA - SS2025 ===';
SELECT TOP 10 KDA_Rank, Nickname, Position, TeamShort, AvgKDA, AvgGPM, WinRate, TotalMatches
FROM vw_Leaderboard_KDA WHERE SeasonID = 'SS2025' ORDER BY KDA_Rank;
GO

PRINT '=== Bảng xếp hạng đội - SS2025 ===';
SELECT TOP 12 Standing_Rank, TeamName, Wins, Losses, WinRate, Points, GoalDiff
FROM vw_TeamStandings WHERE SeasonID = 'SS2025' ORDER BY Standing_Rank;
GO

PRINT '=== Leaderboard Jungle - SS2025 ===';
SELECT Position_Rank, Nickname, TeamShort, AvgKDA, AvgGPM, WinRate
FROM vw_Leaderboard_KDA WHERE SeasonID = 'SS2025' AND Position = 'Jungle'
ORDER BY Position_Rank;
GO

PRINT '✅ 05_VIEWS.sql hoàn tất!';
GO