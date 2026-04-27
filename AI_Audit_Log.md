# AI Audit Log — Esports League Project

> **Mục đích:** Tài liệu hóa việc sử dụng AI theo yêu cầu rubric (15% điểm).
> Cấu trúc: Prompt đã dùng → Code AI sinh ra → Phần tự sửa + lý do kỹ thuật.

---

## 1. Aggregation Pipeline — `aggregation_player_form.js`

**Prompt đã dùng:**
> "Viết MongoDB aggregation pipeline để tính avg KDA, avg GPM của player P001 trong 50 trận gần nhất. Document có cấu trúc lồng nhau: match → teams[] → players[]."

**Code AI sinh ra ban đầu:**
```js
{ $group: {
    _id: "$teams.players.player_id",
    avg_kills:   { $avg: "$teams.players.kills" },
    avg_deaths:  { $avg: "$teams.players.deaths" },
    avg_kda:     { $divide: ["$avg_kills_computed", "$avg_deaths_computed"] }
}}
```

**Phần tôi tự sửa:**
1. **KDA tính per-match trước khi group:** AI tính `avg(kills) / avg(deaths)` — sai về thống kê. Ví dụ: 3 trận (10/1), (2/5), (0/0) → AI cho KDA = 4.0, đúng phải là avg(10, 0.4, 0) = 3.47. Tôi sửa: dùng `$addFields` tính `kda_per_match = (kills+assists)/max(deaths,1)` TRƯỚC `$group`.
2. **NULL handling:** Thêm `$max: ["$deaths", 1]` tránh chia cho 0 khi deaths = 0.
3. **Thêm `$bucket`:** AI không đề xuất phân phối KDA. Tôi thêm pipeline thứ 2 với boundaries [0,2,4,6] → 4 nhóm: Poor/Average/Good/Excellent.
4. **Thêm `avg_gpm`:** AI bỏ sót. Tôi thêm với guard `duration_minutes > 0`.

---

## 2. Sync Script — `sync_standings.py`

**Prompt đã dùng:**
> "Viết Python script dùng pymongo và pyodbc để đọc aggregation từ MongoDB rồi upsert vào SQL Server bảng PlayerSeasonStats. Tính AvgKDA, AvgGPM, WinRate theo từng player."

**Code AI sinh ra ban đầu:**
```python
pipeline = [
    {"$unwind": "$teams"},
    {"$group": {
        "_id": "$teams.team_id",
        "total_team_kills": {"$sum": {"$sum": "$teams.players.kills"}}
    }}
]
cursor.execute("UPDATE TEAM_STANDINGS SET TOTAL_KILLS = ? WHERE TEAM_ID = ?", ...)
```

**Phần tôi tự sửa:**
1. **Đổi đơn vị từ Team → Player:** Rubric yêu cầu `PlayerSeasonStats`, AI sync theo team.
2. **Thêm `$unwind "$teams.players"`:** AI chỉ unwind teams, không unwind players tiếp theo — không lấy được stats từng người.
3. **Đổi `UPDATE` → `MERGE`:** AI dùng `UPDATE WHERE` — bỏ sót trường hợp record chưa tồn tại. `MERGE` xử lý cả INSERT lẫn UPDATE trong một câu.
4. **Auto-create bảng:** AI giả định bảng đã có. Tôi thêm `IF NOT EXISTS CREATE TABLE` để chạy được trên môi trường mới.
5. **KDA per-match trong pipeline:** Tương tự mục 1 — tránh sai số avg(K/D) ≠ avg(K)/avg(D).

---

## 3. Trigger SQL — `03_triggers.sql`

**Prompt đã dùng:**
> "Viết SQL Server trigger ngăn tuyển thủ đăng ký 2 đội trong cùng 1 mùa giải."

**Code AI sinh ra ban đầu:**
```sql
CREATE TRIGGER trg_CheckRoster ON Rosters AFTER INSERT AS
BEGIN
    IF EXISTS (SELECT PlayerID FROM Rosters WHERE PlayerID IN (SELECT PlayerID FROM inserted)
               GROUP BY PlayerID HAVING COUNT(DISTINCT TeamID) > 1)
    ROLLBACK; RAISERROR('Duplicate', 16, 1);
END
```

**Phần tôi tự sửa:**
1. **Race condition — thiếu `SeasonID` trong filter:** AI group theo `PlayerID` không lọc mùa → sẽ block tuyển thủ chuyển sang mùa tiếp theo (false positive). Tôi thêm `AND r.SeasonID = i.SeasonID`.
2. **Thiếu `Status = 'ACTIVE'`:** Tuyển thủ đã `TRANSFERRED_OUT` vẫn có record trong Rosters → AI sẽ block nhầm. Tôi thêm `WHERE r.Status = 'ACTIVE' AND i.Status = 'ACTIVE'`.
3. **AFTER INSERT, UPDATE:** AI chỉ AFTER INSERT. Cần thêm UPDATE để bắt trường hợp admin re-activate.

---

## 4. Recursive CTE — `06_recursive_cte.sql`

**Prompt đã dùng:**
> "Viết SQL Server Recursive CTE truy vết lịch sử chuyển nhượng dạng cây ASCII, anchor là giao dịch đầu tiên theo thời gian."

**Code AI sinh ra ban đầu:**
```sql
WHERE th.TransferID = (SELECT MIN(TransferID) FROM TransferHistory th2 WHERE th2.PlayerID = th.PlayerID)
```

**Phần tôi tự sửa:**
1. **Anchor dùng `MIN(TransferDate)` thay `MIN(TransferID)`:** `TransferID` là auto-increment, không đảm bảo thứ tự thời gian nếu data được bulk insert không tuần tự.
2. **Thêm `IndentedChain` (ASCII tree):** AI chỉ có chuỗi phẳng "A → B → C". Tôi dùng `REPLICATE(N'    ', Depth) + N'└─ '` để visualize dạng cây rõ ràng.
3. **Guard `Depth < 10`:** AI không có giới hạn đệ quy → infinite loop nếu data có vòng lặp do lỗi nhập.
4. **Tạo VIEW `vw_PlayerTransferSummary`:** Tái sử dụng, tránh viết lại CTE.

---

## 5. SeasonTeams Feature (Backend + Frontend)

**Prompt đã dùng:**
> "Viết React component form admin để đăng ký nhiều đội vào một mùa giải, hiển thị đội đã đăng ký và đội chưa đăng ký, gọi API POST."

**Code AI sinh ra ban đầu:**
AI sinh ra form đơn giản với 2 dropdown (season + team), submit 1 đội mỗi lần.

**Phần tôi tự sửa:**
1. **Multi-select bằng toggle card:** AI dùng `<select multiple>` khó dùng trên mobile. Tôi đổi thành grid các card bấm toggle.
2. **Hiển thị đội đã đăng ký:** AI không có. Tôi thêm `useEffect` load `/season-teams?seasonId=...` khi chọn mùa, hiển thị badge ✓ cho đội đã có.
3. **Lọc chỉ hiện đội chưa đăng ký:** `const unregistered = teams.filter(t => !registeredTeams.includes(t.TeamID))` — tránh đăng ký trùng.
4. **Backend dùng MERGE thay INSERT:** Tránh lỗi duplicate key nếu admin submit lại.

---

## Tổng kết

| File | AI đóng góp | Tôi tự sửa |
|------|-----------|------------|
| `aggregation_player_form.js` | Skeleton pipeline | KDA per-match, NULL guard, $bucket, avg_gpm |
| `sync_standings.py` | Cấu trúc kết nối | Player-level sync, MERGE, auto-create table, unwind players |
| `03_triggers.sql` | Logic cơ bản | SeasonID filter, Status='ACTIVE', AFTER UPDATE |
| `06_recursive_cte.sql` | CTE phẳng | ASCII tree, TransferDate anchor, depth guard, VIEW |
| `SeasonTeamForm.jsx` | Form đơn | Multi-select card, hiển thị đã đăng ký, filter unregistered |
