-- ============================================================
-- FILE: 04_PROCEDURES.sql (fixed syntax + test data)
-- DBMS: SQL Server 2022
-- ============================================================
USE EsportsLeagueDB;
GO

-- ============================================================
-- SP 1: sp_TransferPlayer - Chuyển nhượng ACID + REPEATABLE READ
-- ============================================================
CREATE OR ALTER PROCEDURE sp_TransferPlayer
    @PlayerID    VARCHAR(10),
    @FromTeamID  VARCHAR(10),
    @ToTeamID    VARCHAR(10),
    @SeasonID    VARCHAR(10),
    @TransferFee DECIMAL(15,2) = 0,
    @Reason      NVARCHAR(200) = NULL,
    @ApprovedBy  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- REPEATABLE READ: đảm bảo data đọc lần 1 = lần 2, ngăn Phantom Read
    -- Lý do không dùng READ COMMITTED: quá lỏng, data thay đổi giữa 2 lần đọc
    -- Lý do không dùng SERIALIZABLE: quá chặt, giảm performance không cần thiết
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Bước 1: Validate
        IF @FromTeamID = @ToTeamID
        BEGIN
            RAISERROR(N'❌ FromTeamID và ToTeamID không được trùng nhau.', 16, 1);
            RETURN;
        END

        -- Bước 2: Kiểm tra tuyển thủ đang ACTIVE ở đội cũ
        IF NOT EXISTS (
            SELECT 1 FROM Rosters
            WHERE PlayerID = @PlayerID AND TeamID = @FromTeamID
              AND SeasonID = @SeasonID AND Status = 'ACTIVE'
        )
        BEGIN
            RAISERROR(N'❌ Tuyển thủ không thuộc đội cũ hoặc không ACTIVE.', 16, 1);
            RETURN;
        END

        -- Bước 3: Kiểm tra đội mới còn chỗ (UPDLOCK + HOLDLOCK tránh race condition)
        DECLARE @CurrentCount INT;
        SELECT @CurrentCount = COUNT(*)
        FROM Rosters WITH (UPDLOCK, HOLDLOCK)
        WHERE TeamID = @ToTeamID AND SeasonID = @SeasonID AND Status = 'ACTIVE';

        IF @CurrentCount >= 10
        BEGIN
            RAISERROR(N'❌ Đội mới đã đủ 10 tuyển thủ.', 16, 1);
            RETURN;
        END

        -- Bước 4: Kiểm tra đội mới đã đăng ký mùa
        IF NOT EXISTS (
            SELECT 1 FROM SeasonTeams
            WHERE SeasonID = @SeasonID AND TeamID = @ToTeamID AND Status = 'ACTIVE'
        )
        BEGIN
            RAISERROR(N'❌ Đội mới chưa đăng ký tham gia mùa giải này.', 16, 1);
            RETURN;
        END

        -- Bước 5: Cập nhật đội cũ → TRANSFERRED_OUT
        UPDATE Rosters
        SET Status = 'TRANSFERRED_OUT', LeaveDate = CAST(GETDATE() AS DATE)
        WHERE PlayerID = @PlayerID AND TeamID = @FromTeamID
          AND SeasonID = @SeasonID AND Status = 'ACTIVE';

        -- Bước 6: Thêm vào đội mới
        INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status)
        VALUES (@PlayerID, @ToTeamID, @SeasonID, CAST(GETDATE() AS DATE), 'ACTIVE');

        -- Bước 7: Ghi log
        INSERT INTO TransferHistory (PlayerID, FromTeamID, ToTeamID, SeasonID, TransferFee, Reason, ApprovedBy)
        VALUES (@PlayerID, @FromTeamID, @ToTeamID, @SeasonID, @TransferFee, @Reason, @ApprovedBy);

        -- Bước 8: COMMIT
        COMMIT TRANSACTION;

        SELECT
            p.Nickname   AS TuyenThu,
            ft.TeamName  AS DoiCu,
            tt.TeamName  AS DoiMoi,
            s.SeasonName AS MuaGiai,
            @TransferFee AS PhiChuyenNhuong,
            GETDATE()    AS ThoiGian,
            N'✅ THÀNH CÔNG' AS TrangThai
        FROM Players p
        JOIN Teams ft  ON ft.TeamID  = @FromTeamID
        JOIN Teams tt  ON tt.TeamID  = @ToTeamID
        JOIN Seasons s ON s.SeasonID = @SeasonID
        WHERE p.PlayerID = @PlayerID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg  NVARCHAR(2048) = ERROR_MESSAGE();
        DECLARE @ErrSev  INT            = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSev, 1);
    END CATCH;
END;
GO

-- ============================================================
-- SP 2: sp_RegisterTeamToSeason - Đăng ký đội + roster
-- ============================================================
CREATE OR ALTER PROCEDURE sp_RegisterTeamToSeason
    @TeamID     VARCHAR(10),
    @SeasonID   VARCHAR(10),
    @PlayerList NVARCHAR(MAX)  -- JSON: '["P001","P002","P003","P004","P005"]'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Seasons WHERE SeasonID = @SeasonID AND Status IN ('UPCOMING','ACTIVE'))
        BEGIN
            RAISERROR(N'❌ Mùa giải không tồn tại hoặc đã kết thúc.', 16, 1);
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Teams WHERE TeamID = @TeamID AND IsActive = 1)
        BEGIN
            RAISERROR(N'❌ Đội tuyển không tồn tại.', 16, 1);
            RETURN;
        END

        DECLARE @MaxTeams INT, @CurrentTeams INT;
        SELECT @MaxTeams = MaxTeams FROM Seasons WHERE SeasonID = @SeasonID;
        SELECT @CurrentTeams = COUNT(*) FROM SeasonTeams WHERE SeasonID = @SeasonID AND Status = 'ACTIVE';

        IF @CurrentTeams >= @MaxTeams
        BEGIN
            RAISERROR(N'❌ Mùa giải đã đủ số đội tối đa.', 16, 1);
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM SeasonTeams WHERE SeasonID = @SeasonID AND TeamID = @TeamID)
            INSERT INTO SeasonTeams (SeasonID, TeamID, Status)
            VALUES (@SeasonID, @TeamID, 'ACTIVE');

        INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status)
        SELECT value, @TeamID, @SeasonID, CAST(GETDATE() AS DATE), 'ACTIVE'
        FROM OPENJSON(@PlayerList)
        WHERE value NOT IN (
            SELECT PlayerID FROM Rosters WHERE TeamID = @TeamID AND SeasonID = @SeasonID
        );

        COMMIT TRANSACTION;

        SELECT
            t.TeamName   AS DoiTuyen,
            s.SeasonName AS MuaGiai,
            COUNT(r.PlayerID) AS SoTuyenThu,
            N'✅ Đăng ký thành công' AS TrangThai
        FROM Teams t
        CROSS JOIN Seasons s
        JOIN Rosters r ON r.TeamID = @TeamID AND r.SeasonID = @SeasonID AND r.Status = 'ACTIVE'
        WHERE t.TeamID = @TeamID AND s.SeasonID = @SeasonID
        GROUP BY t.TeamName, s.SeasonName;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg2 NVARCHAR(2048) = ERROR_MESSAGE();
        DECLARE @ErrSev2 INT            = ERROR_SEVERITY();
        RAISERROR(@ErrMsg2, @ErrSev2, 1);
    END CATCH;
END;
GO

-- ============================================================
-- SP 3: sp_GetTeamRoster - Xem roster đội
-- ============================================================
CREATE OR ALTER PROCEDURE sp_GetTeamRoster
    @TeamID   VARCHAR(10),
    @SeasonID VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.PlayerID, p.Nickname, p.FullName, p.Position,
        r.JoinDate, r.Status,
        ISNULL(pss.AvgKDA,      0) AS AvgKDA,
        ISNULL(pss.AvgGPM,      0) AS AvgGPM,
        ISNULL(pss.WinRate,     0) AS WinRate,
        ISNULL(pss.TotalMatches,0) AS TotalMatches
    FROM Rosters r
    JOIN Players p ON p.PlayerID = r.PlayerID
    LEFT JOIN PlayerSeasonStats pss
        ON pss.PlayerID = r.PlayerID AND pss.SeasonID = r.SeasonID
    WHERE r.TeamID = @TeamID AND r.SeasonID = @SeasonID
    ORDER BY
        CASE p.Position
            WHEN 'Top'     THEN 1
            WHEN 'Jungle'  THEN 2
            WHEN 'Mid'     THEN 3
            WHEN 'ADC'     THEN 4
            WHEN 'Support' THEN 5
            ELSE 6
        END, r.Status;
END;
GO

-- ============================================================
-- TEST CASES
-- ============================================================
PRINT '=== TEST SP 1: Chuyển nhượng THÀNH CÔNG ===';
-- P006 (DragonSub1) từ SGD → TDT
BEGIN TRY
    EXEC sp_TransferPlayer
        @PlayerID    = 'P006',
        @FromTeamID  = 'SGD',
        @ToTeamID    = 'TDT',
        @SeasonID    = 'SS2025',
        @TransferFee = 45000000,
        @Reason      = N'Test chuyển nhượng hợp lệ',
        @ApprovedBy  = N'Admin Test';
END TRY
BEGIN CATCH
    PRINT '❌ TEST 1 FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== TEST SP 2: Chuyển nhượng THẤT BẠI - tuyển thủ không ở đội cũ ===';
BEGIN TRY
    EXEC sp_TransferPlayer
        @PlayerID   = 'P002',
        @FromTeamID = 'HNL',   -- P002 thuộc SGD, không phải HNL
        @ToTeamID   = 'FLC',
        @SeasonID   = 'SS2025';
END TRY
BEGIN CATCH
    PRINT '✅ EXPECTED FAILURE: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '';
PRINT '=== TEST SP 3: Xem roster SGD mùa SS2025 ===';
EXEC sp_GetTeamRoster @TeamID = 'SGD', @SeasonID = 'SS2025';
GO

PRINT '';
PRINT '=== TEST SP 4: Xem roster HNL mùa SS2025 ===';
EXEC sp_GetTeamRoster @TeamID = 'HNL', @SeasonID = 'SS2025';
GO

PRINT '============================================================';
PRINT '✅ 04_PROCEDURES.sql hoàn tất! 3 procedures đã tạo.';
PRINT '============================================================';
GO