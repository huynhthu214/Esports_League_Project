// backend/server.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo Database
connectDB();

// Gọi các file định tuyến (Routes)
app.use('/api/analytics', require('./routes/analyticsRoutes'));
// app.use('/api/auth', require('./routes/authRoutes')); // Thúy Vi 
// app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));