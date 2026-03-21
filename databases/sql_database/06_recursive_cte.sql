-- ============================================================
-- FILE: 06_RECURSIVE_CTE.sql (đã fix SeasonID + TeamID)
-- DBMS: SQL Server 2022
-- ============================================================
USE EsportsLeagueDB;
GO

-- ============================================================
-- SP: sp_FindTeammateNetwork - Tìm mạng lưới đồng đội gián tiếp
-- Logic: A đồng đội B → B đồng đội C → A có quan hệ với C
-- ============================================================
CREATE OR ALTER PROCEDURE sp_FindTeammateNetwork
    @RootPlayerID VARCHAR(10),
    @SeasonID     VARCHAR(10),
    @MaxDepth     INT = 2
AS
BEGIN
    SET NOCOUNT ON;
    WITH TeammateNetwork AS (
        -- Anchor: bản thân tuyển thủ
        SELECT
            @RootPlayerID              AS RootPlayerID,
            @RootPlayerID              AS PlayerID,
            CAST(N'' AS NVARCHAR(500)) AS Path,
            0                          AS Depth
        UNION ALL
        -- Recursive: đồng đội của đồng đội
        SELECT
            tn.RootPlayerID,
            r2.PlayerID,
            CAST(tn.Path + CASE WHEN tn.Depth = 0 THEN N'' ELSE N' → ' END + p_mid.Nickname AS NVARCHAR(500)),
            tn.Depth + 1
        FROM TeammateNetwork tn
        JOIN Rosters r1 ON r1.PlayerID = tn.PlayerID AND r1.SeasonID = @SeasonID AND r1.Status = 'ACTIVE'
        JOIN Rosters r2 ON r2.TeamID   = r1.TeamID   AND r2.SeasonID = @SeasonID AND r2.Status = 'ACTIVE'
                        AND r2.PlayerID <> tn.PlayerID AND r2.PlayerID <> tn.RootPlayerID
        JOIN Players p_mid ON p_mid.PlayerID = tn.PlayerID
        WHERE tn.Depth < @MaxDepth
    )
    SELECT DISTINCT
        root_p.Nickname AS [Tuyển thủ gốc],
        p.Nickname      AS [Đồng đội],
        p.Position      AS [Vị trí],
        t.TeamName      AS [Đội hiện tại],
        tn.Depth        AS [Cấp độ],
        CASE tn.Depth
            WHEN 1 THEN N'Đồng đội trực tiếp'
            WHEN 2 THEN N'Bạn của đồng đội'
            WHEN 3 THEN N'Kết nối cấp 3'
        END             AS [Loại quan hệ],
        tn.Path + N' → ' + p.Nickname AS [Đường kết nối]
    FROM TeammateNetwork tn
    JOIN Players p       ON p.PlayerID       = tn.PlayerID
    JOIN Players root_p  ON root_p.PlayerID  = tn.RootPlayerID
    JOIN Rosters r       ON r.PlayerID       = tn.PlayerID AND r.SeasonID = @SeasonID
    JOIN Teams t         ON t.TeamID         = r.TeamID
    WHERE tn.Depth > 0
    ORDER BY tn.Depth, p.Nickname;
END;
GO

-- ============================================================
-- CTE: Chuỗi chuyển nhượng lịch sử
-- ============================================================
WITH TransferChain AS (
    SELECT
        th.PlayerID, th.FromTeamID, th.ToTeamID, th.TransferDate,
        1 AS TransferOrder,
        CAST(tf.TeamName + N' → ' + tt.TeamName AS NVARCHAR(500)) AS Chain
    FROM TransferHistory th
    JOIN Teams tf ON tf.TeamID = th.FromTeamID
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    WHERE th.TransferID = (
        SELECT MIN(TransferID) FROM TransferHistory th2 WHERE th2.PlayerID = th.PlayerID
    )
    UNION ALL
    SELECT
        th.PlayerID, th.FromTeamID, th.ToTeamID, th.TransferDate,
        tc.TransferOrder + 1,
        CAST(tc.Chain + N' → ' + tt.TeamName AS NVARCHAR(500))
    FROM TransferChain tc
    JOIN TransferHistory th ON th.PlayerID = tc.PlayerID
                            AND th.FromTeamID = tc.ToTeamID
                            AND th.TransferDate > tc.TransferDate
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    WHERE tc.TransferOrder < 10
)
SELECT
    p.Nickname        AS [Tuyển thủ],
    tc.Chain          AS [Lịch sử chuyển nhượng],
    tc.TransferOrder  AS [Số lần chuyển],
    tc.TransferDate   AS [Chuyển nhượng cuối]
FROM TransferChain tc
JOIN Players p ON p.PlayerID = tc.PlayerID
WHERE tc.TransferOrder = (
    SELECT MAX(tc2.TransferOrder) FROM TransferChain tc2 WHERE tc2.PlayerID = tc.PlayerID
)
ORDER BY tc.TransferOrder DESC;
GO

-- ============================================================
-- TEST (dùng SeasonID SS2025)
-- ============================================================
PRINT '=== TEST: Mạng lưới đồng đội của JungleKing (P002) - SS2025 ===';
EXEC sp_FindTeammateNetwork @RootPlayerID = 'P002', @SeasonID = 'SS2025', @MaxDepth = 2;
GO

PRINT '=== TEST: Mạng lưới đồng đội của DragonTop (P001) - SS2025 ===';
EXEC sp_FindTeammateNetwork @RootPlayerID = 'P001', @SeasonID = 'SS2025', @MaxDepth = 2;
GO

PRINT '✅ 06_RECURSIVE_CTE.sql hoàn tất!';
GO