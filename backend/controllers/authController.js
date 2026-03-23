// controllers/authController.js - (THÚY VI)
// ================================================================
// Bảng Users KHÔNG có trong 01_CREATE_TABLES.sql gốc
// → cần chạy đoạn SQL bên dưới trước khi dùng Auth API:
//
//   CREATE TABLE Users (
//     UserID       INT IDENTITY(1,1) PRIMARY KEY,
//     Username     NVARCHAR(100) NOT NULL UNIQUE,
//     PasswordHash NVARCHAR(255) NOT NULL,
//     Role         VARCHAR(20)   NOT NULL DEFAULT 'FAN'
//                  CHECK (Role IN ('ADMIN','ANALYST','COACH','FAN')),
//     CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE()
//   );
//
// Hoặc thêm thủ công trong DbGate
// ================================================================
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool, sql } = require("../config/db");

// ================================================================
// ĐĂNG KÝ
// POST /api/auth/register
// Body: { username, password, role? }
// ================================================================
const register = async (req, res) => {
  const { username, password, role = "FAN" } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập username và password." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password phải có ít nhất 6 ký tự." });
  }
  if (!["ADMIN", "ANALYST", "COACH", "FAN"].includes(role)) {
    return res.status(400).json({ message: "Role không hợp lệ." });
  }

  try {
    const pool = getPool();

    // Kiểm tra username đã tồn tại
    const exist = await pool
      .request()
      .input("uname", sql.NVarChar(100), username)
      .query("SELECT UserID FROM Users WHERE Username = @uname");

    if (exist.recordset.length > 0) {
      return res.status(409).json({ message: "Username đã tồn tại." });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("uname", sql.NVarChar(100), username)
      .input("hash", sql.NVarChar(255), hash)
      .input("role", sql.VarChar(20), role).query(`
        INSERT INTO Users (Username, PasswordHash, Role)
        OUTPUT INSERTED.UserID
        VALUES (@uname, @hash, @role)
      `);

    res.status(201).json({
      message: "Đăng ký thành công.",
      userId: result.recordset[0].UserID,
    });
  } catch (err) {
    console.error("register error:", err.message);
    // Bắt lỗi khi bảng Users chưa được tạo
    if (err.message?.includes("Invalid object name 'Users'")) {
      return res.status(500).json({
        message:
          "Bảng Users chưa được tạo trong database. Vui lòng chạy script tạo bảng Users.",
      });
    }
    res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
};

// ================================================================
// ĐĂNG NHẬP
// POST /api/auth/login
// Body: { username, password }
// Trả về: { token, user: { userId, username, role } }
// ================================================================
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập username và password." });
  }

  try {
    const pool = getPool();

    const result = await pool
      .request()
      .input("uname", sql.NVarChar(100), username)
      .query(
        "SELECT UserID, Username, PasswordHash, Role FROM Users WHERE Username = @uname",
      );

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ message: "Username hoặc password không đúng." });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Username hoặc password không đúng." });
    }

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.json({
      message: "Đăng nhập thành công.",
      token,
      user: { userId: user.UserID, username: user.Username, role: user.Role },
    });
  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

module.exports = { register, login };
