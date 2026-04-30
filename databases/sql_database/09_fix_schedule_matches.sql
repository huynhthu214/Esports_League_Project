-- ============================================================
-- FILE: fix_schedule_matches.sql
-- MỤC ĐÍCH: Thêm các trận ĐÃ LÊN LỊCH (chưa có kết quả)
--           cho mùa SS2025_2 để trang Lịch Thi Đấu hiển thị
--
-- GHI CHÚ: API getMatchSchedule lọc WHERE WinnerTeamID IS NULL
--          Tất cả 20 trận SS2025 đều đã có winner → lịch trống
--          Giải pháp: thêm trận "upcoming" cho SS2025_2
-- ============================================================
USE EsportsLeagueDB;
GO

PRINT '============================================================';
PRINT 'Thêm trận sắp diễn ra cho SS2025_2 (Lịch Thi Đấu)';
PRINT '============================================================';

-- Xóa trận test cũ nếu có (tránh conflict)
DELETE FROM Matches WHERE MatchID LIKE 'MS2025_2_%' AND WinnerTeamID IS NULL;
GO

-- Vòng bảng SS2025_2 — 16 trận sắp diễn ra (WinnerTeamID = NULL)
INSERT INTO Matches
    (MatchID, SeasonID, Team1ID, Team2ID, WinnerTeamID,
     Team1Score, Team2Score, MatchDate, Venue, Format, DurationMinutes, MVPPlayerID)
VALUES
-- Tuần 1 (tháng 5/2026 — tương lai)
('MS2_001','SS2025_2','SGD','HNL', NULL, 0,0, '2026-05-05 14:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_002','SS2025_2','FLC','TDT', NULL, 0,0, '2026-05-05 17:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_003','SS2025_2','DNS','HPX', NULL, 0,0, '2026-05-06 14:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_004','SS2025_2','CTW','BHT', NULL, 0,0, '2026-05-06 17:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_005','SS2025_2','NTS','VTB', NULL, 0,0, '2026-05-07 14:00', 'Arena Hà Nội', 'BO3', NULL, NULL),
('MS2_006','SS2025_2','LAE','TNB', NULL, 0,0, '2026-05-07 17:00', 'Arena Hà Nội', 'BO3', NULL, NULL),

-- Tuần 2
('MS2_007','SS2025_2','SGD','FLC', NULL, 0,0, '2026-05-12 14:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_008','SS2025_2','HNL','DNS', NULL, 0,0, '2026-05-12 17:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_009','SS2025_2','TDT','CTW', NULL, 0,0, '2026-05-13 14:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_010','SS2025_2','HPX','NTS', NULL, 0,0, '2026-05-13 17:00', 'Arena Đà Nẵng','BO3', NULL, NULL),

-- Tuần 3
('MS2_011','SS2025_2','BHT','LAE', NULL, 0,0, '2026-05-19 14:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_012','SS2025_2','VTB','TNB', NULL, 0,0, '2026-05-19 17:00', 'Arena NEXUS',  'BO3', NULL, NULL),
('MS2_013','SS2025_2','SGD','DNS', NULL, 0,0, '2026-05-20 14:00', 'Arena NEXUS',  'BO5', NULL, NULL),
('MS2_014','SS2025_2','HNL','FLC', NULL, 0,0, '2026-05-20 17:00', 'Arena NEXUS',  'BO5', NULL, NULL),

-- Tuần 4 — Play-offs preview
('MS2_015','SS2025_2','SGD','TDT', NULL, 0,0, '2026-05-26 16:00', 'Arena NEXUS',  'BO5', NULL, NULL),
('MS2_016','SS2025_2','HNL','CTW', NULL, 0,0, '2026-05-27 16:00', 'Arena NEXUS',  'BO5', NULL, NULL);
GO

PRINT '  ✅ Đã thêm 16 trận sắp diễn ra cho SS2025_2';

-- Kiểm tra
SELECT
    MatchID,
    SeasonID,
    Team1ID + ' vs ' + Team2ID  AS [Trận đấu],
    CONVERT(VARCHAR(16), MatchDate, 120) AS [Ngày giờ],
    Format,
    Venue,
    CASE WHEN WinnerTeamID IS NULL THEN '⏳ Chưa đấu' ELSE '✅ Có kết quả' END AS [Trạng thái]
FROM Matches
WHERE SeasonID = 'SS2025_2'
ORDER BY MatchDate;
GO

SELECT
    'SS2025_2 upcoming' AS [Loại],
    COUNT(*) AS [Số trận]
FROM Matches
WHERE SeasonID = 'SS2025_2' AND WinnerTeamID IS NULL

UNION ALL

SELECT 'SS2025 completed', COUNT(*)
FROM Matches
WHERE SeasonID = 'SS2025' AND WinnerTeamID IS NOT NULL;
GO

PRINT '';
PRINT '============================================================';
PRINT '✅ fix_schedule_matches.sql hoàn tất!';
PRINT '   Trang Lịch Thi Đấu → chọn SS2025_2 sẽ hiện 16 trận.';
PRINT '   Trang Lịch Sử → chọn SS2025 vẫn hiện 20 trận cũ.';
PRINT '============================================================';