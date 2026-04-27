# Esports League Project

Hệ thống quản lý và phân tích giải đấu Esports — Polyglot Persistence (SQL Server + MongoDB).

## Kiến trúc hệ thống

```
Frontend (React + Vite)  ←→  Backend (Node.js/Express)
                                    ↓              ↓
                           MS SQL Server      MongoDB
                           (Entity data)   (Match logs)
                                    ↑
                           sync_standings.py
                           (Aggregated stats)
```

**Lý do phân chia SQL / NoSQL (CAP Theorem):**
- **SQL Server (CP):** Roster, Standings, Transfers — cần ACID, không chấp nhận inconsistency. Trigger bảo vệ ràng buộc nghiệp vụ.
- **MongoDB (AP):** MatchStats — document lồng nhau (match→teams→players), schema linh hoạt, ghi nhanh. Eventual consistency chấp nhận được với dữ liệu lịch sử.

---

## Yêu cầu cài đặt

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | >= 18.x |
| Python | >= 3.10 |
| MS SQL Server | 2019 / 2022 |
| MongoDB | >= 6.0 |
| ODBC Driver | 17 for SQL Server |

---

## Cài đặt & Chạy

### 1. Clone & cài dependencies

```bash
git clone https://github.com/huynhthu214/Esports_League_Project.git
cd Esports_League_Project

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Python scripts
cd ../integration_scripts
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

Tạo file `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/esports_league

# MS SQL Server
MSSQL_SERVER=localhost
MSSQL_DATABASE=EsportsLeagueDB
MSSQL_USER=sa
MSSQL_PASS=YourPassword123

# JWT
JWT_SECRET=your_secret_key_here
PORT=5000
```

Tạo file `integration_scripts/.env` (copy từ backend/.env):

```env
MONGO_URI=mongodb://localhost:27017/
MSSQL_SERVER=localhost
MSSQL_DATABASE=EsportsLeagueDB
MSSQL_USER=sa
MSSQL_PASS=YourPassword123
```

### 3. Khởi tạo SQL Server

Chạy các file SQL theo thứ tự trong SSMS:

```
databases/sql_database/
  01_create_tables.sql      -- Tạo bảng
  02_insert_data.sql        -- Dữ liệu mẫu
  03_triggers.sql           -- Triggers kiểm soát roster
  04_procedures.sql         -- Stored procedures
  05_views.sql              -- Views + DENSE_RANK
  06_recursive_cte.sql      -- Recursive CTE chuyển nhượng
  07_integration.sql        -- MongoMatchRef, indexes
```

### 4. Khởi tạo MongoDB

```bash
cd databases/nosql_database

# Sinh dữ liệu match mẫu
python generate_data.py

# Tạo indexes
mongosh esports_league run_indexes.js

# Test aggregation
mongosh esports_league run_aggregations.js
```

### 5. Chạy backend

```bash
cd backend
npm start
# Server chạy tại http://localhost:5000
```

### 6. Chạy frontend

```bash
cd frontend
npm run dev
# Mở http://localhost:5173
```

### 7. Sync MongoDB → SQL

```bash
cd integration_scripts
python sync_standings.py SS2025
```

---

## Tài khoản mặc định

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | 123456 |
| Analyst | analyst1 | 123456 |
| Fan | fan1 | 123456 |

---

## Quy trình Admin (thứ tự bắt buộc)

```
1. Tạo mùa giải         /admin/season
2. Đăng ký đội vào mùa  /admin/season-teams   ← BẮT BUỘC trước bước 3
3. Đăng ký Roster        /admin/roster
4. Nhập kết quả trận     /admin/match
```

> ⚠️ Bỏ qua bước 2 → Trigger `trg_ValidateRosterTeamInSeason` sẽ block bước 3.

---

## Cấu trúc thư mục

```
Esports_League_Project/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js      # CRUD entities, leaderboards
│   │   ├── analyticsController.js  # MongoDB aggregation + dự đoán
│   │   └── matchController.js      # Dual-write SQL + MongoDB
│   ├── routes/
│   └── server.js
├── frontend/src/pages/
│   ├── public/     # Fan: bảng xếp hạng, lịch thi đấu, chuyển nhượng
│   ├── admin/      # Admin: quản lý mùa, roster, trận đấu
│   └── analyst/    # Analyst: phân tích KDA, meta, dự đoán
├── databases/
│   ├── sql_database/    # .sql files (01-07)
│   └── nosql_database/  # aggregation pipelines + schema
├── integration_scripts/
│   └── sync_standings.py
└── AI_Audit_Log.md
```

---

## Execution Plan (Appendix)

Để demo tối ưu hóa query, chạy trong SSMS:

```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Query phức tạp nhất: DENSE_RANK trên view
SELECT * FROM vw_Leaderboard_KDA WHERE SeasonID = 'SS2025'
ORDER BY KDA_Rank;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

Sau đó nhấn **Ctrl+M** (Include Actual Execution Plan) trước khi chạy để xem đồ thị.
Chụp ảnh và đặt vào Appendix báo cáo PDF.
