-- ============================================================
-- FILE: fix_roster_ss2025_2.sql
-- MỤC ĐÍCH: Thêm Roster SS2025_2 đúng cách (5 player/đội)
--           Bypass giới hạn trigger bằng cách chỉ insert
--           5 tuyển thủ CHÍNH THỨC (starter) mỗi đội
--
-- NGUYÊN NHÂN LỖI CŨ:
--   Trigger trg_CheckRosterLimit chặn > 10 ACTIVE/đội/mùa.
--   Một số đội SS2025 có 6-7 player — copy nguyên sang SS2025_2
--   cộng thêm thì vượt giới hạn.
--
-- GIẢI PHÁP: Chỉ insert 5 player STARTER (lineup chính) mỗi đội.
-- ============================================================
USE EsportsLeagueDB;
GO

-- Kiểm tra xem SS2025_2 đã có roster chưa
DECLARE @count INT = (SELECT COUNT(*) FROM Rosters WHERE SeasonID = 'SS2025_2');
PRINT 'Rosters SS2025_2 hiện tại: ' + CAST(@count AS VARCHAR);
GO

-- ============================================================
-- INSERT 5 player chính thức mỗi đội (không dùng sub-select
-- để tránh trigger đếm nhầm batch)
-- ============================================================

-- SGD — Saigon Dragons
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P001','SGD','SS2025_2','2025-06-01','ACTIVE'),
('P002','SGD','SS2025_2','2025-06-01','ACTIVE'),
('P004','SGD','SS2025_2','2025-06-01','ACTIVE'),
('P005','SGD','SS2025_2','2025-06-01','ACTIVE'),
('P006','SGD','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ SGD roster SS2025_2 đã thêm';

-- HNL — Hanoi Legends
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P011','HNL','SS2025_2','2025-06-01','ACTIVE'),
('P012','HNL','SS2025_2','2025-06-01','ACTIVE'),
('P013','HNL','SS2025_2','2025-06-01','ACTIVE'),
('P014','HNL','SS2025_2','2025-06-01','ACTIVE'),
('P015','HNL','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ HNL roster SS2025_2 đã thêm';

-- FLC — Falcon Esports
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P021','FLC','SS2025_2','2025-06-01','ACTIVE'),
('P022','FLC','SS2025_2','2025-06-01','ACTIVE'),
('P023','FLC','SS2025_2','2025-06-01','ACTIVE'),
('P024','FLC','SS2025_2','2025-06-01','ACTIVE'),
('P025','FLC','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ FLC roster SS2025_2 đã thêm';

-- TDT — Thunder Tigers
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P031','TDT','SS2025_2','2025-06-01','ACTIVE'),
('P032','TDT','SS2025_2','2025-06-01','ACTIVE'),
('P033','TDT','SS2025_2','2025-06-01','ACTIVE'),
('P034','TDT','SS2025_2','2025-06-01','ACTIVE'),
('P035','TDT','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ TDT roster SS2025_2 đã thêm';

-- DNS — Da Nang Storm
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P041','DNS','SS2025_2','2025-06-01','ACTIVE'),
('P042','DNS','SS2025_2','2025-06-01','ACTIVE'),
('P043','DNS','SS2025_2','2025-06-01','ACTIVE'),
('P044','DNS','SS2025_2','2025-06-01','ACTIVE'),
('P045','DNS','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ DNS roster SS2025_2 đã thêm';

-- HPX — Hue Phoenix
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P051','HPX','SS2025_2','2025-06-01','ACTIVE'),
('P052','HPX','SS2025_2','2025-06-01','ACTIVE'),
('P053','HPX','SS2025_2','2025-06-01','ACTIVE'),
('P054','HPX','SS2025_2','2025-06-01','ACTIVE'),
('P055','HPX','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ HPX roster SS2025_2 đã thêm';

-- CTW — Can Tho Warriors
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P061','CTW','SS2025_2','2025-06-01','ACTIVE'),
('P062','CTW','SS2025_2','2025-06-01','ACTIVE'),
('P063','CTW','SS2025_2','2025-06-01','ACTIVE'),
('P064','CTW','SS2025_2','2025-06-01','ACTIVE'),
('P065','CTW','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ CTW roster SS2025_2 đã thêm';

-- BHT — Bien Hoa Titans
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P071','BHT','SS2025_2','2025-06-01','ACTIVE'),
('P072','BHT','SS2025_2','2025-06-01','ACTIVE'),
('P073','BHT','SS2025_2','2025-06-01','ACTIVE'),
('P074','BHT','SS2025_2','2025-06-01','ACTIVE'),
('P075','BHT','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ BHT roster SS2025_2 đã thêm';

-- NTS — Nha Trang Sharks
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P081','NTS','SS2025_2','2025-06-01','ACTIVE'),
('P082','NTS','SS2025_2','2025-06-01','ACTIVE'),
('P083','NTS','SS2025_2','2025-06-01','ACTIVE'),
('P084','NTS','SS2025_2','2025-06-01','ACTIVE'),
('P085','NTS','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ NTS roster SS2025_2 đã thêm';

-- VTB — Vung Tau Blazers
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P091','VTB','SS2025_2','2025-06-01','ACTIVE'),
('P092','VTB','SS2025_2','2025-06-01','ACTIVE'),
('P093','VTB','SS2025_2','2025-06-01','ACTIVE'),
('P094','VTB','SS2025_2','2025-06-01','ACTIVE'),
('P095','VTB','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ VTB roster SS2025_2 đã thêm';

-- LAE — Long An Eagles
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P101','LAE','SS2025_2','2025-06-01','ACTIVE'),
('P102','LAE','SS2025_2','2025-06-01','ACTIVE'),
('P103','LAE','SS2025_2','2025-06-01','ACTIVE'),
('P104','LAE','SS2025_2','2025-06-01','ACTIVE'),
('P105','LAE','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ LAE roster SS2025_2 đã thêm';

-- TNB — Tay Ninh Bears
INSERT INTO Rosters (PlayerID, TeamID, SeasonID, JoinDate, Status) VALUES
('P111','TNB','SS2025_2','2025-06-01','ACTIVE'),
('P112','TNB','SS2025_2','2025-06-01','ACTIVE'),
('P113','TNB','SS2025_2','2025-06-01','ACTIVE'),
('P114','TNB','SS2025_2','2025-06-01','ACTIVE'),
('P115','TNB','SS2025_2','2025-06-01','ACTIVE');
GO
PRINT '✅ TNB roster SS2025_2 đã thêm';

-- ============================================================
-- KIỂM TRA
-- ============================================================
SELECT
    r.SeasonID,
    r.TeamID,
    t.TeamName,
    COUNT(*) AS SoPlayer
FROM Rosters r
JOIN Teams t ON t.TeamID = r.TeamID
WHERE r.SeasonID = 'SS2025_2'
  AND r.Status   = 'ACTIVE'
GROUP BY r.SeasonID, r.TeamID, t.TeamName
ORDER BY r.TeamID;
GO

SELECT 'Tổng roster SS2025_2' AS [Kiểm tra], COUNT(*) AS [Số dòng]
FROM Rosters WHERE SeasonID = 'SS2025_2';
GO

PRINT '';
PRINT '============================================================';
PRINT '✅ fix_roster_ss2025_2.sql hoàn tất!';
PRINT '   12 đội x 5 player = 60 roster entries cho SS2025_2';
PRINT '============================================================';