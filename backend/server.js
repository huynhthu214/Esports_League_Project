// backend/server.js - File gốc khởi chạy server
require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
require("dotenv").config();

console.log("=== DEBUG ENV ===");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Có" : "❌ Không");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Có" : "❌ Không");
console.log("=================")

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
app.use(express.urlencoded({ extended: true })); 

app.get("/", (req, res) => {
  res.send(`
    <h1>🎉 Esports League Backend đang chạy ngon!</h1>
    <p>✅ MSSQL | ✅ MongoDB | Port: 5000</p>
    <hr>
    
    <h3>🔑 Test Đăng Nhập (Form HTML)</h3>
    <form action="/api/auth/login" method="POST">
      Username: <input name="username" value="admin" style="width:200px"><br><br>
      Password: <input name="password" type="password" value="123456" style="width:200px"><br><br>
      <button type="submit" style="padding:10px 20px">🚀 Đăng nhập</button>
    </form>
    
    <p><strong>Hoặc dùng Postman (khuyến nghị):</strong></p>
    <ul>
      <li>POST <code>http://localhost:5000/api/auth/login</code></li>
      <li>Body → raw → JSON:
        <pre>
{
  "username": "admin",
  "password": "123456"
}
        </pre>
      </li>
      <li>POST <code>http://localhost:5000/api/auth/register</code> cũng test được</li>
    </ul>
    <a href="/api/health">→ Test Health</a>
  `);
});

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
      console.log(`Server chạy tại http://localhost:${PORT}`);
    });
};

start();
