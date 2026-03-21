-- ============================================================
-- FILE: 02_INSERT_DATA.sql (version mới - gộp cả 00_SYNC)
-- TeamID = ShortName (SGD/HNL/FLC/TDT) để khớp MongoDB
-- CHẠY SAU 01_CREATE_TABLES.sql, KHÔNG cần 00_SYNC nữa
-- ============================================================
USE EsportsLeagueDB;
GO

-- 1. SEASONS
INSERT INTO Seasons (SeasonID, SeasonName, StartDate, EndDate, MaxTeams, Format, Status) VALUES
('SS2025',   N'Season Spring 2025', '2025-01-01', '2025-06-30', 12, 'BO3', 'COMPLETED'),
('SS2025_2', N'Season Summer 2025', '2025-06-01', '2025-09-30', 12, 'BO3', 'ACTIVE');
GO

-- 2. TEAMS (TeamID = ShortName để khớp MongoDB)
INSERT INTO Teams (TeamID, TeamName, ShortName, Region, FoundedYear) VALUES
('SGD', N'Saigon Dragons',   'SGD', N'TP.HCM',    2019),
('HNL', N'Hanoi Legends',    'HNL', N'Hà Nội',    2018),
('DNS', N'Da Nang Storm',    'DNS', N'Đà Nẵng',   2020),
('HPX', N'Hue Phoenix',      'HPX', N'Huế',       2021),
('CTW', N'Can Tho Warriors', 'CTW', N'Cần Thơ',   2020),
('BHT', N'Bien Hoa Titans',  'BHT', N'Biên Hòa',  2021),
('NTS', N'Nha Trang Sharks', 'NTS', N'Nha Trang',  2019),
('VTB', N'Vung Tau Blazers', 'VTB', N'Vũng Tàu',  2022),
('LAE', N'Long An Eagles',   'LAE', N'Long An',    2022),
('TNB', N'Tay Ninh Bears',   'TNB', N'Tây Ninh',  2023),
('FLC', N'Falcon Esports',   'FLC', N'Bình Dương', 2021),
('TDT', N'Thunder Tigers',   'TDT', N'Đồng Nai',  2020);
GO

-- 3. PLAYERS (SGD:P001-005, HNL:P011-015, FLC:P021-025, TDT:P031-035 khớp MongoDB)
INSERT INTO Players (PlayerID, Nickname, FullName, DateOfBirth, Position) VALUES
('P001','DragonTop',  N'Nguyễn Minh Khoa','2001-03-15','Top'),
('P002','JungleKing', N'Trần Văn Hùng',   '2000-07-22','Jungle'),
('P003','MidLane99',  N'Lê Quốc Anh',     '2002-01-10','Mid'),
('P004','SGD_ADC',    N'Phạm Thành Long', '2001-11-05','ADC'),
('P005','SGD_Support',N'Hoàng Đức Minh',  '2003-04-18','Support'),
('P006','DragonSub1', N'Võ Thanh Tùng',   '2002-08-30','Jungle'),
('P007','DragonSub2', N'Đặng Hữu Nghĩa',  '2003-12-01','Mid'),
('P011','ForestLord', N'Bùi Văn Nam',     '2000-05-14','Jungle'),
('P012','HNL_Top',    N'Đinh Quang Hải',  '2001-09-27','Top'),
('P013','LegendMid',  N'Trịnh Văn Khải',  '2002-02-20','Mid'),
('P014','HNL_ADC',    N'Ngô Đình Toàn',   '2000-06-11','ADC'),
('P015','HNL_Support',N'Phan Thị Lan',    '2003-10-08','Support'),
('P016','HanoiSub1',  N'Lưu Đức Thịnh',   '2002-03-25','Top'),
('P017','HanoiSub2',  N'Tô Minh Phúc',    '2003-07-19','ADC'),
('P021','FalconTop',  N'Cao Xuân Dũng',   '2001-04-12','Top'),
('P022','FalconJG',   N'Lý Thanh Bình',   '2000-08-03','Jungle'),
('P023','FalconMid',  N'Huỳnh Tấn Phát',  '2002-11-17','Mid'),
('P024','FalconADC',  N'Phan Văn Đức',    '2001-01-29','ADC'),
('P025','FalconSup',  N'Mai Thị Hoa',     '2003-05-06','Support'),
('P026','FalconSub1', N'Nguyễn Trọng Khải','2002-09-14','Jungle'),
('P031','ThunderTop', N'Đoàn Văn Hậu',    '2001-06-22','Top'),
('P032','ThunderJG',  N'Nguyễn Hải Nam',  '2000-10-15','Jungle'),
('P033','ThunderMid', N'Lê Công Vinh',    '2002-04-07','Mid'),
('P034','ThunderADC', N'Trần Đình Trọng', '2001-12-19','ADC'),
('P035','ThunderSup', N'Vũ Văn Thanh',    '2003-03-11','Support'),
('P036','ThunderSub1',N'Đinh Thanh Bình', '2002-07-24','Mid'),
('P041','StormTop',   N'Lê Văn Xuân',     '2001-02-16','Top'),
('P042','StormJG',    N'Nguyễn Công Phượng','2000-04-21','Jungle'),
('P043','StormMid',   N'Trần Minh Vương', '2002-06-13','Mid'),
('P044','StormADC',   N'Phạm Đức Huy',    '2001-08-09','ADC'),
('P045','StormSup',   N'Hoàng Văn Toản',  '2003-01-27','Support'),
('P051','PhoenixTop', N'Dương Văn Hào',   '2001-05-30','Top'),
('P052','PhoenixJG',  N'Trần Quốc Tuấn',  '2000-09-18','Jungle'),
('P053','PhoenixMid', N'Nguyễn Văn Quyết','2002-01-05','Mid'),
('P054','PhoenixADC', N'Lê Anh Đức',      '2001-07-12','ADC'),
('P055','PhoenixSup', N'Phạm Hồng Duy',   '2003-10-24','Support'),
('P061','WarriorTop', N'Kiều Văn Khang',  '2001-03-08','Top'),
('P062','WarriorJG',  N'Nguyễn Tuấn Anh', '2000-11-29','Jungle'),
('P063','WarriorMid', N'Trần Bảo Toàn',   '2002-05-17','Mid'),
('P064','WarriorADC', N'Lê Phát Hiển',    '2001-09-04','ADC'),
('P065','WarriorSup', N'Phan Thanh Hào',  '2003-02-21','Support'),
('P071','TitanTop',   N'Hà Minh Tuấn',    '2001-07-26','Top'),
('P072','TitanJG',    N'Trương Đình Đức', '2000-12-14','Jungle'),
('P073','TitanMid',   N'Nguyễn Anh Khoa', '2002-03-22','Mid'),
('P074','TitanADC',   N'Lê Ngọc Sơn',     '2001-10-07','ADC'),
('P075','TitanSup',   N'Trần Hữu Đông',   '2003-06-18','Support'),
('P081','SharkTop',   N'Lâm Văn Phong',   '2001-01-19','Top'),
('P082','SharkJG',    N'Đào Văn Hữu',     '2000-05-28','Jungle'),
('P083','SharkMid',   N'Ngô Xuân Tình',   '2002-09-03','Mid'),
('P084','SharkADC',   N'Trần Cao Vân',    '2001-11-16','ADC'),
('P085','SharkSup',   N'Võ Ngọc Tâm',     '2003-04-29','Support'),
('P091','BlazerTop',  N'Trần Văn Cường',  '2001-06-05','Top'),
('P092','BlazerJG',   N'Nguyễn Đức Chinh','2000-02-23','Jungle'),
('P093','BlazerMid',  N'Lê Tấn Tài',      '2002-08-31','Mid'),
('P094','BlazerADC',  N'Phạm Văn Mạnh',   '2001-04-14','ADC'),
('P095','BlazerSup',  N'Đinh Xuân Thắng', '2003-11-26','Support'),
('P101','EagleTop',   N'Nguyễn Tiến Linh','2001-10-12','Top'),
('P102','EagleJG',    N'Trần Huy Hoàng',  '2000-03-07','Jungle'),
('P103','EagleMid',   N'Lê Quang Dũng',   '2002-07-25','Mid'),
('P104','EagleADC',   N'Phạm Thế Khoa',   '2001-12-31','ADC'),
('P105','EagleSup',   N'Hoàng Đức Thắng', '2003-09-16','Support'),
('P111','BearTop',    N'Trần Văn Kiên',   '2001-08-17','Top'),
('P112','BearJG',     N'Nguyễn Xuân Trường','2000-06-09','Jungle'),
('P113','BearMid',    N'Lê Văn Hải',      '2002-10-28','Mid'),
('P114','BearADC',    N'Phạm Thành Nam',  '2001-03-06','ADC'),
('P115','BearSup',    N'Hoàng Thị Loan',  '2003-07-14','Support');
GO

-- 4. SEASON TEAMS
INSERT INTO SeasonTeams (SeasonID, TeamID) VALUES
('SS2025','SGD'),('SS2025','HNL'),('SS2025','DNS'),('SS2025','HPX'),
('SS2025','CTW'),('SS2025','BHT'),('SS2025','NTS'),('SS2025','VTB'),
('SS2025','LAE'),('SS2025','TNB'),('SS2025','FLC'),('SS2025','TDT'),
('SS2025_2','SGD'),('SS2025_2','HNL'),('SS2025_2','DNS'),('SS2025_2','HPX'),
('SS2025_2','CTW'),('SS2025_2','BHT'),('SS2025_2','NTS'),('SS2025_2','VTB'),
('SS2025_2','LAE'),('SS2025_2','TNB'),('SS2025_2','FLC'),('SS2025_2','TDT');
GO

-- 5. ROSTERS SS2025
INSERT INTO Rosters (PlayerID,TeamID,SeasonID,JoinDate,Status) VALUES
('P001','SGD','SS2025','2025-01-01','ACTIVE'),('P002','SGD','SS2025','2025-01-01','ACTIVE'),
('P003','SGD','SS2025','2025-01-01','TRANSFERRED_OUT'),('P004','SGD','SS2025','2025-01-01','ACTIVE'),
('P005','SGD','SS2025','2025-01-01','ACTIVE'),('P006','SGD','SS2025','2025-01-01','ACTIVE'),
('P011','HNL','SS2025','2025-01-01','ACTIVE'),('P012','HNL','SS2025','2025-01-01','ACTIVE'),
('P013','HNL','SS2025','2025-01-01','ACTIVE'),('P014','HNL','SS2025','2025-01-01','ACTIVE'),
('P015','HNL','SS2025','2025-01-01','ACTIVE'),('P003','HNL','SS2025','2025-02-15','ACTIVE'),
('P021','FLC','SS2025','2025-01-01','ACTIVE'),('P022','FLC','SS2025','2025-01-01','ACTIVE'),
('P023','FLC','SS2025','2025-01-01','ACTIVE'),('P024','FLC','SS2025','2025-01-01','ACTIVE'),
('P025','FLC','SS2025','2025-01-01','ACTIVE'),
('P031','TDT','SS2025','2025-01-01','ACTIVE'),('P032','TDT','SS2025','2025-01-01','ACTIVE'),
('P033','TDT','SS2025','2025-01-01','ACTIVE'),('P034','TDT','SS2025','2025-01-01','ACTIVE'),
('P035','TDT','SS2025','2025-01-01','ACTIVE'),
('P041','DNS','SS2025','2025-01-01','ACTIVE'),('P042','DNS','SS2025','2025-01-01','ACTIVE'),
('P043','DNS','SS2025','2025-01-01','ACTIVE'),('P044','DNS','SS2025','2025-01-01','ACTIVE'),
('P045','DNS','SS2025','2025-01-01','ACTIVE'),
('P051','HPX','SS2025','2025-01-01','ACTIVE'),('P052','HPX','SS2025','2025-01-01','ACTIVE'),
('P053','HPX','SS2025','2025-01-01','ACTIVE'),('P054','HPX','SS2025','2025-01-01','ACTIVE'),
('P055','HPX','SS2025','2025-01-01','ACTIVE'),
('P061','CTW','SS2025','2025-01-01','ACTIVE'),('P062','CTW','SS2025','2025-01-01','ACTIVE'),
('P063','CTW','SS2025','2025-01-01','ACTIVE'),('P064','CTW','SS2025','2025-01-01','ACTIVE'),
('P065','CTW','SS2025','2025-01-01','ACTIVE'),
('P071','BHT','SS2025','2025-01-01','ACTIVE'),('P072','BHT','SS2025','2025-01-01','ACTIVE'),
('P073','BHT','SS2025','2025-01-01','ACTIVE'),('P074','BHT','SS2025','2025-01-01','ACTIVE'),
('P075','BHT','SS2025','2025-01-01','ACTIVE'),
('P081','NTS','SS2025','2025-01-01','ACTIVE'),('P082','NTS','SS2025','2025-01-01','ACTIVE'),
('P083','NTS','SS2025','2025-01-01','ACTIVE'),('P084','NTS','SS2025','2025-01-01','ACTIVE'),
('P085','NTS','SS2025','2025-01-01','ACTIVE'),
('P091','VTB','SS2025','2025-01-01','ACTIVE'),('P092','VTB','SS2025','2025-01-01','ACTIVE'),
('P093','VTB','SS2025','2025-01-01','ACTIVE'),('P094','VTB','SS2025','2025-01-01','ACTIVE'),
('P095','VTB','SS2025','2025-01-01','ACTIVE'),
('P101','LAE','SS2025','2025-01-01','ACTIVE'),('P102','LAE','SS2025','2025-01-01','ACTIVE'),
('P103','LAE','SS2025','2025-01-01','ACTIVE'),('P104','LAE','SS2025','2025-01-01','ACTIVE'),
('P105','LAE','SS2025','2025-01-01','ACTIVE'),
('P111','TNB','SS2025','2025-01-01','ACTIVE'),('P112','TNB','SS2025','2025-01-01','ACTIVE'),
('P113','TNB','SS2025','2025-01-01','ACTIVE'),('P114','TNB','SS2025','2025-01-01','ACTIVE'),
('P115','TNB','SS2025','2025-01-01','ACTIVE');
GO

-- 6. MATCHES
INSERT INTO Matches (MatchID,SeasonID,Team1ID,Team2ID,WinnerTeamID,Team1Score,Team2Score,MatchDate,Venue,DurationMinutes,MVPPlayerID) VALUES
('M2025_001','SS2025','SGD','HNL','SGD',2,1,'2025-01-20 14:00','Arena SGD',95,'P002'),
('M2025_002','SS2025','FLC','TDT','FLC',2,0,'2025-01-20 17:00','Arena SGD',72,'P022'),
('M2025_003','SS2025','CTW','BHT','CTW',2,1,'2025-01-21 14:00','Arena SGD',88,'P062'),
('M2025_004','SS2025','NTS','VTB','NTS',2,0,'2025-01-21 17:00','Arena SGD',65,'P082'),
('M2025_005','SS2025','LAE','TNB','LAE',2,1,'2025-01-22 14:00','Arena SGD',91,'P102'),
('M2025_006','SS2025','DNS','HPX','DNS',2,0,'2025-01-22 17:00','Arena SGD',70,'P042'),
('M2025_007','SS2025','SGD','FLC','SGD',2,0,'2025-01-27 14:00','Arena SGD',80,'P002'),
('M2025_008','SS2025','HNL','CTW','HNL',2,1,'2025-01-27 17:00','Arena SGD',99,'P011'),
('M2025_009','SS2025','TDT','NTS','TDT',2,1,'2025-01-28 14:00','Arena SGD',105,'P032'),
('M2025_010','SS2025','BHT','LAE','LAE',1,2,'2025-01-28 17:00','Arena SGD',110,'P102'),
('M2025_011','SS2025','VTB','DNS','DNS',0,2,'2025-02-03 14:00','Arena SGD',77,'P042'),
('M2025_012','SS2025','TNB','HPX','HPX',1,2,'2025-02-03 17:00','Arena SGD',93,'P052'),
('M2025_013','SS2025','SGD','CTW','SGD',2,0,'2025-02-10 14:00','Arena SGD',68,'P002'),
('M2025_014','SS2025','HNL','FLC','HNL',2,1,'2025-02-10 17:00','Arena SGD',87,'P011'),
('M2025_015','SS2025','SGD','TDT','SGD',2,1,'2025-02-17 14:00','Arena SGD',102,'P002'),
('M2025_016','SS2025','HNL','BHT','HNL',2,0,'2025-02-17 17:00','Arena SGD',75,'P013'),
('M2025_017','SS2025','FLC','CTW','FLC',2,1,'2025-02-24 14:00','Arena SGD',84,'P022'),
('M2025_018','SS2025','SGD','BHT','SGD',2,0,'2025-03-03 14:00','Arena SGD',73,'P002'),
('M2025_019','SS2025','HNL','TDT','HNL',2,1,'2025-03-03 17:00','Arena SGD',96,'P011'),
('M2025_020','SS2025','SGD','HNL','SGD',3,2,'2025-04-20 16:00',N'Arena Chung Kết',155,'P002');
GO

-- 7. STANDINGS
INSERT INTO TeamStandings (SeasonID,TeamID,Wins,Losses,Points,WinRate,GoalDiff) VALUES
('SS2025','SGD',7,0,21,100.00,14),('SS2025','HNL',5,2,15,71.43,7),
('SS2025','FLC',4,2,12,66.67,5), ('SS2025','TDT',3,3,9,50.00,0),
('SS2025','DNS',3,2,9,60.00,3),  ('SS2025','HPX',2,2,6,50.00,1),
('SS2025','CTW',2,3,6,40.00,-2), ('SS2025','BHT',1,4,3,20.00,-6),
('SS2025','NTS',2,1,6,66.67,2),  ('SS2025','VTB',1,2,3,33.33,-3),
('SS2025','LAE',2,2,6,50.00,1),  ('SS2025','TNB',0,3,0,0.00,-5);
GO

-- 8. TRANSFERS
INSERT INTO TransferHistory (PlayerID,FromTeamID,ToTeamID,SeasonID,TransferDate,TransferFee,Reason,ApprovedBy)
VALUES ('P003','SGD','HNL','SS2025','2025-02-14',50000000,N'Theo nguyện vọng cầu thủ',N'Admin League');
GO

-- 9. PLAYER STATS
INSERT INTO PlayerSeasonStats (PlayerID,SeasonID,TeamID,TotalMatches,TotalKills,TotalDeaths,TotalAssists,TotalGold,AvgKDA,AvgGPM,WinRate) VALUES
('P002','SS2025','SGD',20,180,36,240,2840000,11.67,425.5,100.0),
('P011','SS2025','HNL',18,144,45,189,2430000,7.40,398.2,72.2),
('P022','SS2025','FLC',14,112,35,168,1890000,8.00,378.6,66.7),
('P001','SS2025','SGD',20,100,40,200,2600000,7.50,390.0,100.0),
('P013','SS2025','HNL',18,90,36,162,2070000,7.00,345.0,72.2),
('P042','SS2025','DNS',13,91,26,130,1690000,8.50,388.5,60.0),
('P052','SS2025','HPX',12,84,28,126,1512000,7.50,360.0,50.0),
('P032','SS2025','TDT',12,72,30,108,1440000,6.00,320.0,50.0),
('P102','SS2025','LAE',11,66,33,99,1320000,5.00,300.0,54.5),
('P082','SS2025','NTS',10,60,25,90,1200000,6.00,320.0,66.7);
GO

-- KIỂM TRA
SELECT 'Seasons' AS [Table],COUNT(*) AS [Rows] FROM Seasons           UNION ALL
SELECT 'Teams',             COUNT(*)            FROM Teams             UNION ALL
SELECT 'Players',           COUNT(*)            FROM Players           UNION ALL
SELECT 'Rosters',           COUNT(*)            FROM Rosters           UNION ALL
SELECT 'Matches',           COUNT(*)            FROM Matches           UNION ALL
SELECT 'TeamStandings',     COUNT(*)            FROM TeamStandings     UNION ALL
SELECT 'TransferHistory',   COUNT(*)            FROM TransferHistory   UNION ALL
SELECT 'PlayerSeasonStats', COUNT(*)            FROM PlayerSeasonStats;

PRINT '✅ 02_INSERT_DATA.sql hoàn tất! TeamID khớp MongoDB (SGD/HNL/FLC/TDT).';
GO