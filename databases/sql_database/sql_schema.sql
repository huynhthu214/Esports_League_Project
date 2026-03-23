-- ============================================================
-- SQL SCHEMA - Esports League (MS SQL Server)
-- Chạy file này trong DbGate hoặc SSMS để khởi tạo database
-- ============================================================

-- Tạo database (nếu chưa có)
-- CREATE DATABASE esports_league;
-- GO
-- USE esports_league;
-- GO

-- ========================
-- 1. USERS (Tài khoản hệ thống)
-- ========================
CREATE TABLE Users (
    UserID       INT IDENTITY(1,1) PRIMARY KEY,
    Username     NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(20)  NOT NULL CHECK (Role IN ('ADMIN','ANALYST','COACH','FAN')),
    CreatedAt    DATETIME      DEFAULT GETDATE()
);

-- ========================
-- 2. PLAYERS (Tuyển thủ)
-- ========================
CREATE TABLE Players (
    PlayerID    INT IDENTITY(1,1) PRIMARY KEY,
    Nickname    NVARCHAR(100) NOT NULL,
    FullName    NVARCHAR(200),
    Country     NVARCHAR(100),
    CreatedAt   DATETIME DEFAULT GETDATE()
);

-- ========================
-- 3. TEAMS (Đội tuyển)
-- ========================
CREATE TABLE Teams (
    TeamID    INT IDENTITY(1,1) PRIMARY KEY,
    Name      NVARCHAR(100) NOT NULL,
    ShortName NVARCHAR(10),
    Country   NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ========================
-- 4. SEASONS (Mùa giải)
-- ========================
CREATE TABLE Seasons (
    SeasonID  INT IDENTITY(1,1) PRIMARY KEY,
    Name      NVARCHAR(100) NOT NULL,
    StartDate DATE          NOT NULL,
    EndDate   DATE          NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ========================
-- 5. ROSTERS (Danh sách tuyển thủ trong đội theo mùa)
-- Ràng buộc: 1 player không được thuộc 2 đội trong cùng 1 season
-- ========================
CREATE TABLE Rosters (
    RosterID  INT IDENTITY(1,1) PRIMARY KEY,
    PlayerID  INT  NOT NULL REFERENCES Players(PlayerID),
    TeamID    INT  NOT NULL REFERENCES Teams(TeamID),
    SeasonID  INT  NOT NULL REFERENCES Seasons(SeasonID),
    JoinDate  DATE DEFAULT GETDATE(),
    -- Unique: mỗi player chỉ 1 đội per season
    CONSTRAINT UQ_Roster_Player_Season UNIQUE (PlayerID, SeasonID)
);

-- TRIGGER: Kiểm tra tuyển thủ không thuộc 2 đội cùng season
-- (Backup cho UNIQUE constraint, cũng cung cấp message rõ ràng hơn)
GO
CREATE TRIGGER trg_CheckRosterDuplicate
ON Rosters
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN Rosters r ON r.PlayerID = i.PlayerID
                      AND r.SeasonID = i.SeasonID
                      AND r.RosterID <> i.RosterID
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('Vi phạm ràng buộc: tuyển thủ đã thuộc một đội trong mùa giải này.', 16, 1);
    END
END;
GO

-- ========================
-- 6. TRANSFERS (Log chuyển nhượng)
-- ========================
CREATE TABLE Transfers (
    TransferID    INT IDENTITY(1,1) PRIMARY KEY,
    PlayerID      INT  NOT NULL REFERENCES Players(PlayerID),
    FromTeamID    INT  NOT NULL REFERENCES Teams(TeamID),
    ToTeamID      INT  NOT NULL REFERENCES Teams(TeamID),
    SeasonID      INT  NOT NULL REFERENCES Seasons(SeasonID),
    TransferDate  DATETIME DEFAULT GETDATE()
);

-- ========================
-- 7. TEAMSTANDINGS (Bảng điểm đội — cập nhật bởi Dual-Write)
-- ========================
CREATE TABLE TeamStandings (
    StandingID INT IDENTITY(1,1) PRIMARY KEY,
    TeamID     INT NOT NULL REFERENCES Teams(TeamID),
    SeasonID   INT NOT NULL REFERENCES Seasons(SeasonID),
    Wins       INT DEFAULT 0,
    Losses     INT DEFAULT 0,
    CONSTRAINT UQ_Standing_Team_Season UNIQUE (TeamID, SeasonID)
);

-- ========================
-- 8. PLAYERSTATS (Thống kê tuyển thủ per match — cho Leaderboard)
-- Note: Chi tiết trận lưu ở MongoDB, đây là summary để SQL query nhanh
-- ========================
CREATE TABLE PlayerStats (
    StatID          INT IDENTITY(1,1) PRIMARY KEY,
    PlayerID        INT NOT NULL REFERENCES Players(PlayerID),
    MatchID         NVARCHAR(50),   -- ID của document MongoDB tương ứng
    SeasonID        INT REFERENCES Seasons(SeasonID),
    Kills           INT DEFAULT 0,
    Deaths          INT DEFAULT 0,
    Assists         INT DEFAULT 0,
    Gold            INT DEFAULT 0,
    DurationMinutes INT DEFAULT 0,
    MatchDate       DATETIME DEFAULT GETDATE()
);

-- ========================
-- SAMPLE DATA (để test)
-- ========================
INSERT INTO Teams (Name, ShortName, Country) VALUES
    (N'Team Alpha',   'TA',  'Vietnam'),
    (N'Team Beta',    'TB',  'Vietnam'),
    (N'Team Gamma',   'TG',  'Vietnam');

INSERT INTO Seasons (Name, StartDate, EndDate) VALUES
    (N'VCS 2024 Spring', '2024-01-01', '2024-06-30'),
    (N'VCS 2024 Summer', '2024-07-01', '2024-12-31');

INSERT INTO Players (Nickname, FullName, Country) VALUES
    ('SofM',   N'Lê Quang Dũng',    'Vietnam'),
    ('Zeros',  N'Nguyễn Văn Hùng',  'Vietnam'),
    ('Slayder',N'Trần Minh Khoa',   'Vietnam'),
    ('Kiaya',  N'Phạm Đức Long',    'Vietnam'),
    ('Palette',N'Hoàng Văn Nam',    'Vietnam');

-- TeamStandings khởi tạo cho season 1
INSERT INTO TeamStandings (TeamID, SeasonID, Wins, Losses) VALUES
    (1, 1, 0, 0),
    (2, 1, 0, 0),
    (3, 1, 0, 0);

-- ========================
-- QUERY DEMO cho bảo vệ
-- ========================

-- Demo DENSE_RANK (chạy sau khi có dữ liệu PlayerStats)
/*
SELECT
    DENSE_RANK() OVER (ORDER BY AVG(CAST(Kills + Assists AS FLOAT) / NULLIF(Deaths, 0)) DESC) AS [Rank],
    p.Nickname,
    ROUND(AVG(CAST(Kills + Assists AS FLOAT) / NULLIF(Deaths, 0)), 2) AS AvgKDA
FROM PlayerStats ps
JOIN Players p ON ps.PlayerID = p.PlayerID
GROUP BY p.PlayerID, p.Nickname
ORDER BY AvgKDA DESC;
*/

-- Demo ROW_NUMBER (để thấy sự khác biệt với DENSE_RANK khi có đồng hạng)
/*
SELECT
    ROW_NUMBER() OVER (ORDER BY AVG(CAST(Kills + Assists AS FLOAT) / NULLIF(Deaths, 0)) DESC) AS [Row],
    DENSE_RANK() OVER (ORDER BY AVG(CAST(Kills + Assists AS FLOAT) / NULLIF(Deaths, 0)) DESC) AS [DenseRank],
    p.Nickname,
    ROUND(AVG(CAST(Kills + Assists AS FLOAT) / NULLIF(Deaths, 0)), 2) AS AvgKDA
FROM PlayerStats ps
JOIN Players p ON ps.PlayerID = p.PlayerID
GROUP BY p.PlayerID, p.Nickname
ORDER BY AvgKDA DESC;
*/
