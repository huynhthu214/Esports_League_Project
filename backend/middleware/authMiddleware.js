// middleware/authMiddleware.js - (THÚY VI) Kiểm tra JWT Token
const jwt = require("jsonwebtoken");

// ========================
// XÁC THỰC TOKEN
// ========================
const verifyToken = (req, res, next) => {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có token. Vui lòng đăng nhập." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

// ========================
// PHÂN QUYỀN THEO ROLE
// ========================
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bạn không có quyền. Yêu cầu role: ${roles.join(" hoặc ")}.`,
      });
    }
    next();
  };
};

// Các middleware tiện dụng
const requireAdmin = requireRole("ADMIN");
const requireAnalyst = requireRole("ADMIN", "ANALYST", "COACH");
const requireAuth = verifyToken; // alias cho dễ đọc

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireAnalyst,
  requireAuth,
};
