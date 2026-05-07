-- ============================================================
-- FILE: 06_RECURSIVE_CTE.sql (NÂNG CẤP)
-- DBMS: SQL Server 2022
-- NÂNG CẤP: Thêm TransferChain dạng cây đầy đủ + Execution Plan hints
-- ============================================================
USE EsportsLeagueDB;
GO

-- ============================================================
-- [GIỮ NGUYÊN] SP: sp_FindTeammateNetwork
-- ============================================================
CREATE OR ALTER PROCEDURE sp_FindTeammateNetwork
    @RootPlayerID VARCHAR(10),
    @SeasonID     VARCHAR(10),
    @MaxDepth     INT = 2
AS
BEGIN
    SET NOCOUNT ON;
    WITH TeammateNetwork AS (
        SELECT
            @RootPlayerID              AS RootPlayerID,
            @RootPlayerID              AS PlayerID,
            CAST(N'' AS NVARCHAR(500)) AS Path,
            0                          AS Depth
        UNION ALL
        SELECT
            tn.RootPlayerID,
            r2.PlayerID,
            CAST(tn.Path + CASE WHEN tn.Depth = 0 THEN N'' ELSE N' → ' END
                 + p_mid.Nickname AS NVARCHAR(500)),
            tn.Depth + 1
        FROM TeammateNetwork tn
        JOIN Rosters r1 ON r1.PlayerID = tn.PlayerID
                        AND r1.SeasonID = @SeasonID AND r1.Status = 'ACTIVE'
        JOIN Rosters r2 ON r2.TeamID   = r1.TeamID
                        AND r2.SeasonID = @SeasonID AND r2.Status = 'ACTIVE'
                        AND r2.PlayerID <> tn.PlayerID
                        AND r2.PlayerID <> tn.RootPlayerID
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
    JOIN Players p       ON p.PlayerID      = tn.PlayerID
    JOIN Players root_p  ON root_p.PlayerID = tn.RootPlayerID
    JOIN Rosters r       ON r.PlayerID      = tn.PlayerID AND r.SeasonID = @SeasonID
    JOIN Teams t         ON t.TeamID        = r.TeamID
    WHERE tn.Depth > 0
    ORDER BY tn.Depth, p.Nickname;
END;
GO


-- ============================================================
-- [NÂNG CẤP] Recursive CTE: Cây lịch sử chuyển nhượng
-- Khác bản cũ:
--   1. Anchor dùng PlayerID làm root (không dùng MIN TransferID)
--   2. Thêm cột Depth để rõ cấp độ cây
--   3. Thêm cột IndentedChain để visualize dạng cây ASCII
--   4. Thêm thông tin transfer_fee và reason nếu có
-- ============================================================
;WITH TransferChain AS (

    -- ── Anchor: Giao dịch đầu tiên của mỗi tuyển thủ ──────────────────
    SELECT
        th.PlayerID,
        th.TransferID,
        th.FromTeamID,
        th.ToTeamID,
        th.TransferDate,
        th.TransferFee,
        th.Reason,
        1                                                     AS Depth,
        -- Chuỗi tên đội dạng phẳng
        CAST(tf.TeamName + N' → ' + tt.TeamName
             AS NVARCHAR(2000))                               AS Chain,
        -- Dạng cây có thụt lề (indent)
        CAST(N'[Root] ' + tf.TeamName + N' → ' + tt.TeamName
             AS NVARCHAR(2000))                               AS IndentedChain,
        -- Lưu ToTeamID để bước sau nối tiếp
        th.ToTeamID                                           AS CurrentTeamID

    FROM TransferHistory th
    JOIN Teams tf ON tf.TeamID = th.FromTeamID
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    -- Chỉ lấy giao dịch đầu tiên của mỗi tuyển thủ làm Anchor
    WHERE th.TransferDate = (
        SELECT MIN(th2.TransferDate)
        FROM TransferHistory th2
        WHERE th2.PlayerID = th.PlayerID
    )

    UNION ALL

    -- ── Recursive: Tiếp tục chuỗi chuyển nhượng ──────────────────────
    SELECT
        th.PlayerID,
        th.TransferID,
        th.FromTeamID,
        th.ToTeamID,
        th.TransferDate,
        th.TransferFee,
        th.Reason,
        tc.Depth + 1,
        -- Nối thêm đội mới vào chuỗi phẳng
        CAST(tc.Chain + N' → ' + tt.TeamName
             AS NVARCHAR(2000)),
        -- Thụt lề theo cấp độ để visualize dạng cây
        CAST(
            REPLICATE(N'    ', tc.Depth)          -- indent = 4 spaces × depth
            + N'└─ ' + tt.TeamName
            + N' (' + CONVERT(VARCHAR(10), th.TransferDate, 120) + N')'
            AS NVARCHAR(2000)
        ),
        th.ToTeamID

    FROM TransferChain tc
    JOIN TransferHistory th
        ON  th.PlayerID    = tc.PlayerID
        AND th.FromTeamID  = tc.CurrentTeamID        -- nối từ đội hiện tại
        AND th.TransferDate > tc.TransferDate        -- chỉ giao dịch sau
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    WHERE tc.Depth < 10                              -- giới hạn đệ quy an toàn
)

-- ── OUTPUT: Bảng kết quả cuối ──────────────────────────────────────────────
SELECT
    p.Nickname                       AS [Tuyển thủ],
    tc.Depth                         AS [Bước chuyển],
    tf_name.TeamName                 AS [Từ đội],
    tt_name.TeamName                 AS [Đến đội],
    tc.TransferDate                  AS [Ngày chuyển],
    ISNULL(CAST(tc.TransferFee AS VARCHAR(20)), N'Không công bố')
                                     AS [Phí chuyển nhượng ($)],
    ISNULL(tc.Reason, N'—')          AS [Lý do],
    tc.IndentedChain                 AS [Cây chuyển nhượng (ASCII)],
    tc.Chain                         AS [Chuỗi đầy đủ]

FROM TransferChain tc
JOIN Players p          ON p.PlayerID          = tc.PlayerID
JOIN Teams   tf_name    ON tf_name.TeamID       = tc.FromTeamID
JOIN Teams   tt_name    ON tt_name.TeamID       = tc.ToTeamID

ORDER BY
    p.Nickname,       -- nhóm theo tuyển thủ
    tc.Depth ASC;     -- theo thứ tự thời gian trong cây
GO


-- ============================================================
-- VIEW phụ trợ: Tóm tắt nhanh toàn bộ lịch sử chuyển nhượng
-- (dùng cho báo cáo, không cần chạy lại CTE dài)
-- ============================================================
CREATE OR ALTER VIEW vw_PlayerTransferSummary AS
WITH TransferChain AS (
    SELECT
        th.PlayerID, th.FromTeamID, th.ToTeamID,
        th.TransferDate, th.TransferFee,
        1 AS Depth,
        CAST(tf.TeamName + N' → ' + tt.TeamName AS NVARCHAR(2000)) AS Chain,
        th.ToTeamID AS CurrentTeamID
    FROM TransferHistory th
    JOIN Teams tf ON tf.TeamID = th.FromTeamID
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    WHERE th.TransferDate = (
        SELECT MIN(th2.TransferDate) FROM TransferHistory th2
        WHERE th2.PlayerID = th.PlayerID
    )
    UNION ALL
    SELECT
        th.PlayerID, th.FromTeamID, th.ToTeamID,
        th.TransferDate, th.TransferFee,
        tc.Depth + 1,
        CAST(tc.Chain + N' → ' + tt.TeamName AS NVARCHAR(2000)),
        th.ToTeamID
    FROM TransferChain tc
    JOIN TransferHistory th
        ON  th.PlayerID   = tc.PlayerID
        AND th.FromTeamID = tc.CurrentTeamID
        AND th.TransferDate > tc.TransferDate
    JOIN Teams tt ON tt.TeamID = th.ToTeamID
    WHERE tc.Depth < 10
),
RankedChain AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY PlayerID ORDER BY Depth DESC) AS rn
    FROM TransferChain
)
SELECT
    p.PlayerID,
    p.Nickname,
    rc.Depth       AS TotalTransfers,
    rc.Chain       AS FullTransferHistory,
    rc.TransferDate AS LastTransferDate
FROM RankedChain rc
JOIN Players p ON p.PlayerID = rc.PlayerID
WHERE rc.rn = 1;
GO


-- ============================================================
-- TEST
-- ============================================================
PRINT '=== TEST 1: Teammate network của JungleKing (P002) ===';
EXEC sp_FindTeammateNetwork @RootPlayerID = 'P002', @SeasonID = 'SS2025', @MaxDepth = 2;
GO

PRINT '=== TEST 2: Cây chuyển nhượng đầy đủ (tất cả tuyển thủ) ===';
-- (Chạy CTE phía trên trực tiếp hoặc qua view)
SELECT * FROM vw_PlayerTransferSummary ORDER BY TotalTransfers DESC;
GO

PRINT '✅ 06_RECURSIVE_CTE.sql (nâng cấp) hoàn tất!';
GO
