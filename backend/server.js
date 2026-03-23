// backend/server.js - File gốc khởi chạy server
require("dotenv").config();
console.log("MONGODB_URI:", process.env.MONGODB_URI);
const express = require("express");
const cors = require("cors");
const { connectSQL, connectMongo } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
app.use(cors({ origin: "http://localhost:5173" })); // Vite default port
app.use(express.json());

// ========================
// ROUTES
// ========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date() }),
);

// ========================
// KHỞI ĐỘNG SERVER
// ========================
const start = async () => {
  await connectSQL();
  await connectMongo();
  app.listen(PORT, () => {
    console.log("Server chạy tại http://localhost:${PORT}");
  });
};

start();
