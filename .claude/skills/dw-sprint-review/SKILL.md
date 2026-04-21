---
name: dw:sprint-review
description: "Tổng kết sprint: tasks hoàn thành, metrics, lessons learned, items cho sprint tiếp theo. Dành cho team retrospective cuối sprint."
argument-hint: "[sprint-name hoặc period: e.g. sprint-3, 2026-03]"
---

# Sprint Review: $ARGUMENTS

## Đọc Config

Đọc `.dw/config/dw.config.yml`:
- `paths.tasks` → tìm task docs
- `.dw/metrics` → tìm effort data
- `tracking.estimation`, `tracking.log_work` → biết có data nào

## Bước 1: Thu thập dữ liệu

### Tasks trong sprint
Scan `{paths.tasks}/` tìm tasks có status Done hoặc In Progress trong kỳ sprint.
Đọc `*-progress.md` của mỗi task để lấy:
- Trạng thái cuối
- Effort estimate vs actual
- Blockers gặp phải
- Commits liên quan

### Git history
```bash
git log --oneline --since="[sprint-start]" --until="[sprint-end]"
```

## Bước 2: Tạo báo cáo sprint

Ghi vào `{paths.reports}/sprint-review-$ARGUMENTS.md`:

```markdown
# Sprint Review: [Sprint Name]

**Kỳ**: [start] → [end]
**Team**: [roles từ config]
**Ngày tạo**: [date]

---

## Tóm Tắt

| Metric | Giá trị |
|--------|---------|
| Tasks hoàn thành | X/Y |
| Estimate tổng | Xh |
| Actual tổng | Xh |
| Accuracy | X% |
| Commits | X |

## Tasks Hoàn Thành

| Task | Estimate | Actual | Variance | Ghi chú |
|------|----------|--------|----------|---------|
| [task-name] | | | | |

## Tasks Chưa Hoàn Thành / Carry-over

| Task | Lý do | Hành động |
|------|-------|-----------|
| | | |

## Blockers Gặp Phải

[Danh sách blockers, đã giải quyết hay chưa]

## Lessons Learned

### Làm tốt (Keep)
- [Điều gì hiệu quả trong sprint này]

### Cần cải thiện (Improve)
- [Điều gì cần làm khác đi]

### Thử nghiệm (Try)
- [Điều gì muốn thử trong sprint sau]

## Items Cho Sprint Tiếp Theo

- [ ] [Action item 1] — owner: [role]
- [ ] [Action item 2]

## DORA Metrics (nếu có data)

| Metric | Giá trị | Target |
|--------|---------|--------|
| Deployment frequency | | |
| Lead time for changes | | |
| Change failure rate | | |
| MTTR | | |
```

## Bước 3: Thông báo

Hiển thị summary và path đến file báo cáo.
Gợi ý: "PM có thể chạy `/dw:dashboard` để xem báo cáo đầy đủ hơn."
