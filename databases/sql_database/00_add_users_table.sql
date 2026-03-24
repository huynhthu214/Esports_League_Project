-- ============================================================
-- FILE: 00_ADD_USERS_TABLE.sql
-- Chạy file này TRƯỚC khi start backend Node.js
-- Bảng Users không có trong schema gốc → cần thêm thủ công
-- ============================================================
USE EsportsLeagueDB;
GO

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
    CREATE TABLE Users (
        UserID       INT           NOT NULL IDENTITY(1,1),
        Username     NVARCHAR(100) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         VARCHAR(20)   NOT NULL DEFAULT 'FAN'
                     CONSTRAINT CK_Users_Role CHECK (Role IN ('ADMIN','ANALYST','COACH','FAN')),
        CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_Users         PRIMARY KEY (UserID),
        CONSTRAINT UQ_Users_Username UNIQUE (Username)
    );

    -- Tạo tài khoản admin mặc định (password: password)
    -- bcrypt hash của "password" với salt=10
    INSERT INTO Users (Username, PasswordHash, Role) VALUES
    ('admin',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN'),
    ('analyst', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ANALYST'),
    ('fan',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'FAN');

    PRINT '✅ Bảng Users đã tạo + 3 tài khoản mặc định (password: password)';
END
ELSE
    PRINT '⚠️  Bảng Users đã tồn tại, bỏ qua.';
GO
