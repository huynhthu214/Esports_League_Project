-- ============================================================
-- FILE: 01_CREATE_TABLES.sql
-- MÔ TẢ: Tạo schema cho hệ thống Esports League Management
-- NHÓM: 09 - Thành viên 1 (SQL Database Lead)
-- DBMS: SQL Server 2022
-- ============================================================

USE master;
GO

-- Tạo database nếu chưa có
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'EsportsLeagueDB')
BEGIN
    CREATE DATABASE EsportsLeagueDB;
END
GO

USE EsportsLeagueDB;
GO

-- ============================================================
-- XÓA BẢNG CŨ (theo thứ tự phụ thuộc FK)
-- ============================================================
IF OBJECT_ID('TransferHistory', 'U') IS NOT NULL DROP TABLE TransferHistory;
IF OBJECT_ID('PlayerSeasonStats', 'U') IS NOT NULL DROP TABLE PlayerSeasonStats;
IF OBJECT_ID('Rosters', 'U') IS NOT NULL DROP TABLE Rosters;
IF OBJECT_ID('TeamStandings', 'U') IS NOT NULL DROP TABLE TeamStandings;
IF OBJECT_ID('Matches', 'U') IS NOT NULL DROP TABLE Matches;
IF OBJECT_ID('SeasonTeams', 'U') IS NOT NULL DROP TABLE SeasonTeams;
IF OBJECT_ID('Players', 'U') IS NOT NULL DROP TABLE Players;
IF OBJECT_ID('Teams', 'U') IS NOT NULL DROP TABLE Teams;
IF OBJECT_ID('Seasons', 'U') IS NOT NULL DROP TABLE Seasons;
GO

-- ============================================================
-- BẢNG 1: Seasons (Mùa giải)
-- ============================================================
CREATE TABLE Seasons (
    SeasonID        VARCHAR(10)     NOT NULL,
    SeasonName      NVARCHAR(100)   NOT NULL,
    StartDate       DATE            NOT NULL,
    EndDate         DATE            NOT NULL,
    MaxTeams        INT             NOT NULL DEFAULT 16,
    Format          NVARCHAR(50)    NOT NULL DEFAULT 'BO3',   -- BO3, BO5
    Status          VARCHAR(20)     NOT NULL DEFAULT 'UPCOMING', -- UPCOMING, ACTIVE, COMPLETED
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Seasons PRIMARY KEY (SeasonID),
    CONSTRAINT CK_Seasons_Dates CHECK (EndDate > StartDate),
    CONSTRAINT CK_Seasons_MaxTeams CHECK (MaxTeams BETWEEN 4 AND 32),
    CONSTRAINT CK_Seasons_Status CHECK (Status IN ('UPCOMING', 'ACTIVE', 'COMPLETED')),
    CONSTRAINT CK_Seasons_Format CHECK (Format IN ('BO1', 'BO3', 'BO5'))
);
GO

-- ============================================================
-- BẢNG 2: Teams (Đội tuyển)
-- ============================================================
CREATE TABLE Teams (
    TeamID          VARCHAR(10)     NOT NULL,
    TeamName        NVARCHAR(100)   NOT NULL,
    ShortName       VARCHAR(10)     NOT NULL,   -- VD: SGD, HNL
    Region          NVARCHAR(50)    NOT NULL DEFAULT N'TP.HCM',
    LogoURL         NVARCHAR(255)   NULL,
    FoundedYear     INT             NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Teams PRIMARY KEY (TeamID),
    CONSTRAINT UQ_Teams_ShortName UNIQUE (ShortName),
    CONSTRAINT UQ_Teams_Name UNIQUE (TeamName)
);
GO

-- ============================================================
-- BẢNG 3: Players (Tuyển thủ)
-- ============================================================
CREATE TABLE Players (
    PlayerID        VARCHAR(10)     NOT NULL,
    Nickname        NVARCHAR(50)    NOT NULL,
    FullName        NVARCHAR(100)   NULL,
    DateOfBirth     DATE            NULL,
    Nationality     NVARCHAR(50)    NOT NULL DEFAULT N'Việt Nam',
    Position        VARCHAR(20)     NOT NULL,   -- Top, Jungle, Mid, ADC, Support
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Players PRIMARY KEY (PlayerID),
    CONSTRAINT UQ_Players_Nickname UNIQUE (Nickname),
    CONSTRAINT CK_Players_Position CHECK (Position IN ('Top', 'Jungle', 'Mid', 'ADC', 'Support'))
);
GO

-- ============================================================
-- BẢNG 4: SeasonTeams (Đội tham gia mùa giải - junction table)
-- ============================================================
CREATE TABLE SeasonTeams (
    SeasonID        VARCHAR(10)     NOT NULL,
    TeamID          VARCHAR(10)     NOT NULL,
    RegisteredAt    DATETIME        NOT NULL DEFAULT GETDATE(),
    Status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISQUALIFIED, WITHDRAWN

    CONSTRAINT PK_SeasonTeams PRIMARY KEY (SeasonID, TeamID),
    CONSTRAINT FK_SeasonTeams_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT FK_SeasonTeams_Team FOREIGN KEY (TeamID) REFERENCES Teams(TeamID),
    CONSTRAINT CK_SeasonTeams_Status CHECK (Status IN ('ACTIVE', 'DISQUALIFIED', 'WITHDRAWN'))
);
GO

-- ============================================================
-- BẢNG 5: Rosters (Danh sách tuyển thủ theo đội/mùa)
-- *** BẢNG QUAN TRỌNG NHẤT - có Trigger kiểm soát ***
-- ============================================================
CREATE TABLE Rosters (
    PlayerID        VARCHAR(10)     NOT NULL,
    TeamID          VARCHAR(10)     NOT NULL,
    SeasonID        VARCHAR(10)     NOT NULL,
    JoinDate        DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    LeaveDate       DATE            NULL,
    Status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE: đang thi đấu
    -- TRANSFERRED_OUT: đã chuyển đi
    -- RETIRED: giải nghệ
    -- SUSPENDED: bị treo giò

    CONSTRAINT PK_Rosters PRIMARY KEY (PlayerID, TeamID, SeasonID),
    CONSTRAINT FK_Rosters_Player FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID),
    CONSTRAINT FK_Rosters_Team FOREIGN KEY (TeamID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Rosters_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT CK_Rosters_Status CHECK (Status IN ('ACTIVE', 'TRANSFERRED_OUT', 'RETIRED', 'SUSPENDED')),
    CONSTRAINT CK_Rosters_Dates CHECK (LeaveDate IS NULL OR LeaveDate >= JoinDate)
);
GO

-- ============================================================
-- BẢNG 6: Matches (Trận đấu - metadata, chi tiết stats ở MongoDB)
-- ============================================================
CREATE TABLE Matches (
    MatchID         VARCHAR(20)     NOT NULL,
    SeasonID        VARCHAR(10)     NOT NULL,
    Team1ID         VARCHAR(10)     NOT NULL,
    Team2ID         VARCHAR(10)     NOT NULL,
    WinnerTeamID    VARCHAR(10)     NULL,       -- NULL nếu chưa có kết quả
    Team1Score      INT             NOT NULL DEFAULT 0,
    Team2Score      INT             NOT NULL DEFAULT 0,
    MatchDate       DATETIME        NOT NULL,
    Venue           NVARCHAR(100)   NULL,
    Format          VARCHAR(10)     NOT NULL DEFAULT 'BO3',
    DurationMinutes INT             NULL,       -- Tổng thời gian (phút)
    MVPPlayerID     VARCHAR(10)     NULL,
    MongoMatchRef   VARCHAR(50)     NULL,       -- Reference đến MongoDB document
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Matches PRIMARY KEY (MatchID),
    CONSTRAINT FK_Matches_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT FK_Matches_Team1 FOREIGN KEY (Team1ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Matches_Team2 FOREIGN KEY (Team2ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Matches_Winner FOREIGN KEY (WinnerTeamID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Matches_MVP FOREIGN KEY (MVPPlayerID) REFERENCES Players(PlayerID),
    CONSTRAINT CK_Matches_DiffTeams CHECK (Team1ID <> Team2ID),
    CONSTRAINT CK_Matches_Format CHECK (Format IN ('BO1', 'BO3', 'BO5'))
);
GO

-- ============================================================
-- BẢNG 7: TeamStandings (Bảng xếp hạng đội theo mùa)
-- ============================================================
CREATE TABLE TeamStandings (
    SeasonID        VARCHAR(10)     NOT NULL,
    TeamID          VARCHAR(10)     NOT NULL,
    Wins            INT             NOT NULL DEFAULT 0,
    Losses          INT             NOT NULL DEFAULT 0,
    Points          INT             NOT NULL DEFAULT 0,      -- Điểm tích lũy
    WinRate         DECIMAL(5,2)    NOT NULL DEFAULT 0.00,   -- % thắng
    GoalDiff        INT             NOT NULL DEFAULT 0,      -- Hiệu số game thắng/thua
    LastUpdated     DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_TeamStandings PRIMARY KEY (SeasonID, TeamID),
    CONSTRAINT FK_TeamStandings_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT FK_TeamStandings_Team FOREIGN KEY (TeamID) REFERENCES Teams(TeamID),
    CONSTRAINT CK_TeamStandings_Wins CHECK (Wins >= 0),
    CONSTRAINT CK_TeamStandings_Losses CHECK (Losses >= 0)
);
GO

-- ============================================================
-- BẢNG 8: PlayerSeasonStats (Stats tổng hợp từ MongoDB - cached)
-- Dùng cho Leaderboard nhanh, được sync từ MongoDB định kỳ
-- ============================================================
CREATE TABLE PlayerSeasonStats (
    PlayerID        VARCHAR(10)     NOT NULL,
    SeasonID        VARCHAR(10)     NOT NULL,
    TeamID          VARCHAR(10)     NOT NULL,
    TotalMatches    INT             NOT NULL DEFAULT 0,
    TotalKills      INT             NOT NULL DEFAULT 0,
    TotalDeaths     INT             NOT NULL DEFAULT 0,
    TotalAssists    INT             NOT NULL DEFAULT 0,
    TotalGold       BIGINT          NOT NULL DEFAULT 0,
    AvgKDA          DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
    AvgGPM          DECIMAL(8,2)    NOT NULL DEFAULT 0.00,   -- Gold Per Minute
    WinRate         DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
    LastSyncedAt    DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_PlayerSeasonStats PRIMARY KEY (PlayerID, SeasonID),
    CONSTRAINT FK_PSS_Player FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID),
    CONSTRAINT FK_PSS_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT FK_PSS_Team FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);
GO

-- ============================================================
-- BẢNG 9: TransferHistory (Lịch sử chuyển nhượng)
-- ============================================================
CREATE TABLE TransferHistory (
    TransferID      INT             NOT NULL IDENTITY(1,1),
    PlayerID        VARCHAR(10)     NOT NULL,
    FromTeamID      VARCHAR(10)     NOT NULL,
    ToTeamID        VARCHAR(10)     NOT NULL,
    SeasonID        VARCHAR(10)     NOT NULL,
    TransferDate    DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    TransferFee     DECIMAL(15,2)   NULL DEFAULT 0,
    Reason          NVARCHAR(200)   NULL,
    ApprovedBy      NVARCHAR(100)   NULL,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_TransferHistory PRIMARY KEY (TransferID),
    CONSTRAINT FK_Transfer_Player FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID),
    CONSTRAINT FK_Transfer_FromTeam FOREIGN KEY (FromTeamID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Transfer_ToTeam FOREIGN KEY (ToTeamID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_Transfer_Season FOREIGN KEY (SeasonID) REFERENCES Seasons(SeasonID),
    CONSTRAINT CK_Transfer_DiffTeams CHECK (FromTeamID <> ToTeamID)
);
GO

-- ============================================================
-- INDEXES bổ sung (tăng hiệu năng query)
-- ============================================================

-- Index cho Rosters - query theo season thường xuyên
CREATE INDEX IX_Rosters_SeasonID ON Rosters(SeasonID, Status);
CREATE INDEX IX_Rosters_PlayerSeason ON Rosters(PlayerID, SeasonID);

-- Index cho Matches - query theo ngày và season
CREATE INDEX IX_Matches_Season ON Matches(SeasonID, MatchDate DESC);
CREATE INDEX IX_Matches_Teams ON Matches(Team1ID, Team2ID, SeasonID);

-- Index cho PlayerSeasonStats - Leaderboard query
CREATE INDEX IX_PSS_Season_KDA ON PlayerSeasonStats(SeasonID, AvgKDA DESC);
CREATE INDEX IX_PSS_Season_GPM ON PlayerSeasonStats(SeasonID, AvgGPM DESC);

-- Index cho TeamStandings - sort theo wins
CREATE INDEX IX_Standings_Season ON TeamStandings(SeasonID, Wins DESC, WinRate DESC);

-- Index cho TransferHistory
CREATE INDEX IX_Transfer_Player ON TransferHistory(PlayerID, TransferDate DESC);
GO

-- ============================================================
-- KIỂM TRA KẾT QUẢ
-- ============================================================
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = 'EsportsLeagueDB'
ORDER BY TABLE_NAME;
GO

PRINT '============================================================';
PRINT '✅ 01_CREATE_TABLES.sql chạy thành công!';
PRINT '   Đã tạo 9 bảng: Seasons, Teams, Players, SeasonTeams,';
PRINT '   Rosters, Matches, TeamStandings, PlayerSeasonStats,';
PRINT '   TransferHistory';
PRINT '============================================================';
GO