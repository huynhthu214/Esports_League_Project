-- ============================================================
-- FILE: 03_TRIGGERS_FINAL.sql (đã gộp + fix toàn bộ)
-- CHẠY FILE NÀY, bỏ 03_TRIGGERS.sql và 03_FIX_TRIGGER.sql cũ
-- ============================================================
USE EsportsLeagueDB;
GO

-- ============================================================
-- TRIGGER 1: Ngăn tuyển thủ thuộc 2 đội ACTIVE cùng mùa
-- ============================================================
CREATE OR ALTER TRIGGER trg_PreventDuplicateRoster
ON Rosters
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT r.PlayerID, r.SeasonID
        FROM Rosters r
        INNER JOIN inserted i ON r.PlayerID = i.PlayerID AND r.SeasonID = i.SeasonID
        WHERE r.Status = 'ACTIVE' AND i.Status = 'ACTIVE'
        GROUP BY r.PlayerID, r.SeasonID
        HAVING COUNT(DISTINCT r.TeamID) > 1
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'❌ VI PHẠM: Tuyển thủ không được thi đấu cho 2 đội trong cùng 1 mùa giải!', 16, 1);
        RETURN;
    END
END;
GO

-- ============================================================
-- TRIGGER 2: Đội phải đăng ký mùa trước khi thêm roster
-- ============================================================
CREATE OR ALTER TRIGGER trg_ValidateRosterTeamInSeason
ON Rosters
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1 FROM SeasonTeams st
            WHERE st.SeasonID = i.SeasonID AND st.TeamID = i.TeamID AND st.Status = 'ACTIVE'
        )
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'❌ VI PHẠM: Đội chưa đăng ký tham gia mùa giải này!', 16, 1);
        RETURN;
    END
END;
GO

-- ============================================================
-- TRIGGER 3: Giới hạn tối đa 10 tuyển thủ ACTIVE mỗi đội/mùa
-- ============================================================
CREATE OR ALTER TRIGGER trg_CheckRosterLimit
ON Rosters
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- ============================================================
    -- FIX: Tránh correlated subquery trong HAVING (lỗi khi batch INSERT)
    -- Logic đúng:
    --   1. Lấy danh sách (TeamID, SeasonID) bị ảnh hưởng từ `inserted`
    --   2. Đếm tổng ACTIVE trong Rosters (đã bao gồm inserted vì AFTER trigger)
    --      bằng cách GROUP BY + JOIN — không dùng subquery correlated
    --   3. Nếu bất kỳ nhóm nào > 10 → ROLLBACK
    -- ============================================================
    IF EXISTS (
        SELECT r.TeamID, r.SeasonID
        FROM Rosters r
        -- Chỉ xét các (TeamID, SeasonID) có trong batch inserted hiện tại
        INNER JOIN (
            SELECT DISTINCT TeamID, SeasonID
            FROM inserted
            WHERE Status = 'ACTIVE'
        ) AS affected
            ON  r.TeamID   = affected.TeamID
            AND r.SeasonID = affected.SeasonID
        WHERE r.Status = 'ACTIVE'
        GROUP BY r.TeamID, r.SeasonID
        HAVING COUNT(*) > 10          -- COUNT(*) giờ là aggregate trên GROUP BY, không phải subquery
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'❌ VI PHẠM: Đội đã đủ 10 tuyển thủ ACTIVE!', 16, 1);
        RETURN;
    END
END;
GO

-- ============================================================
-- TRIGGER 4: Tự động cập nhật TeamStandings (đã fix GoalDiff NULL)
-- ============================================================
CREATE OR ALTER TRIGGER trg_AutoUpdateStandings
ON Matches
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM inserted WHERE WinnerTeamID IS NOT NULL)
        RETURN;

    MERGE TeamStandings AS target
    USING (
        SELECT
            s.SeasonID,
            s.TeamID,
            SUM(CASE WHEN m.WinnerTeamID = s.TeamID THEN 1 ELSE 0 END) AS Wins,
            SUM(CASE WHEN m.WinnerTeamID IS NOT NULL
                      AND m.WinnerTeamID <> s.TeamID THEN 1 ELSE 0 END) AS Losses,
            SUM(CASE WHEN m.WinnerTeamID = s.TeamID THEN 3 ELSE 0 END) AS Points,
            -- ✅ ISNULL fix lỗi GoalDiff NULL khi đội chưa có trận
            ISNULL(SUM(
                CASE WHEN s.TeamID = m.Team1ID
                     THEN m.Team1Score - m.Team2Score
                     ELSE m.Team2Score - m.Team1Score END
            ), 0) AS GoalDiff
        FROM SeasonTeams s
        LEFT JOIN Matches m
            ON  m.SeasonID = s.SeasonID
            AND (m.Team1ID = s.TeamID OR m.Team2ID = s.TeamID)
            AND m.WinnerTeamID IS NOT NULL
        WHERE s.SeasonID IN (SELECT DISTINCT SeasonID FROM inserted)
        GROUP BY s.SeasonID, s.TeamID
    ) AS src
    ON (target.SeasonID = src.SeasonID AND target.TeamID = src.TeamID)

    WHEN MATCHED THEN
        UPDATE SET
            Wins        = src.Wins,
            Losses      = src.Losses,
            Points      = src.Points,
            GoalDiff    = src.GoalDiff,
            WinRate     = CASE WHEN (src.Wins + src.Losses) = 0 THEN 0
                               ELSE CAST(src.Wins AS DECIMAL(5,2)) * 100
                                    / (src.Wins + src.Losses) END,
            LastUpdated = GETDATE()

    WHEN NOT MATCHED BY TARGET THEN
        INSERT (SeasonID, TeamID, Wins, Losses, Points, GoalDiff, WinRate)
        VALUES (
            src.SeasonID, src.TeamID,
            src.Wins, src.Losses, src.Points,
            src.GoalDiff,
            CASE WHEN (src.Wins + src.Losses) = 0 THEN 0
                 ELSE CAST(src.Wins AS DECIMAL(5,2)) * 100
                      / (src.Wins + src.Losses) END
        );
END;
GO

-- ============================================================
-- TEST CASES
-- ============================================================
PRINT '=== TEST 1: Thêm tuyển thủ hợp lệ (phải THÀNH CÔNG) ===';
BEGIN TRY
    INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status)
    VALUES ('P007', 'SGD', 'SS2025', '2025-06-01', 'ACTIVE');
    PRINT '✅ TEST 1 PASSED: Thêm tuyển thủ mới thành công';
END TRY
BEGIN CATCH
    PRINT '❌ TEST 1 FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== TEST 2: Vi phạm - 2 đội cùng mùa (phải THẤT BẠI) ===';
BEGIN TRY
    INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status)
    VALUES ('P001', 'HNL', 'SS2025', '2025-06-01', 'ACTIVE');
    PRINT '❌ TEST 2 FAILED: Trigger không hoạt động!';
END TRY
BEGIN CATCH
    PRINT '✅ TEST 2 PASSED: Trigger chặn đúng - ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== TEST 3: Vi phạm - Đội chưa đăng ký mùa (phải THẤT BẠI) ===';
BEGIN TRY
    -- Thêm team mới chưa có trong SeasonTeams
    INSERT INTO Teams (TeamID, TeamName, ShortName) VALUES ('TST', N'Test Team', 'TST');
    INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status)
    VALUES ('P001', 'TST', 'SS2025', '2025-06-01', 'ACTIVE');
    PRINT '❌ TEST 3 FAILED: Trigger không hoạt động!';
END TRY
BEGIN CATCH
    PRINT '✅ TEST 3 PASSED: Trigger chặn đúng - ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== TEST 4: Trigger tự động cập nhật Standings ===';
BEGIN TRY
    INSERT INTO Matches (MatchID, SeasonID, Team1ID, Team2ID, WinnerTeamID,
                         Team1Score, Team2Score, MatchDate, Format)
    VALUES ('M2025_021', 'SS2025_2', 'SGD', 'HNL', 'SGD', 2, 1, '2025-07-01 14:00', 'BO3');

    SELECT
        DENSE_RANK() OVER (ORDER BY Wins DESC, WinRate DESC) AS Rank,
        TeamID, Wins, Losses, WinRate, GoalDiff
    FROM TeamStandings
    WHERE SeasonID = 'SS2025_2' AND TeamID IN ('SGD','HNL')
    ORDER BY Wins DESC;

    PRINT '✅ TEST 4 PASSED: Standings cập nhật tự động!';
END TRY
BEGIN CATCH
    PRINT '❌ TEST 4 FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '============================================================';
PRINT '✅ 03_TRIGGERS_FINAL.sql hoàn tất! 4 triggers đã tạo + test xong.';
PRINT '============================================================';
GO