# Plan: [Task Name]

## Ngày tạo: [date]
## Trạng thái: Draft → cần approve
## Approved by: —

---

## Tóm Tắt Approach

[1-2 đoạn: tại sao approach này được chọn, alternatives đã bị loại vì lý do gì]

---

## Phương Án Đã Xem Xét

| # | Approach | Ưu điểm | Nhược điểm | Assumptions | Chọn? |
|---|----------|---------|------------|-------------|-------|
| 1 | [Option A] | | | | **Chọn** |
| 2 | [Option B] | | | | Loại — vì: |
| 3 | [Option C] | | | | Loại — vì: |

**Devil's Advocate**: Lý do mạnh nhất để KHÔNG chọn Option A:
> [điền vào]

---

## Subtasks

### ST-1: [Tên subtask]
- **Mô tả**: [actionable, cụ thể]
- **Files thay đổi**: [`path/to/file.ts`]
- **Acceptance Criteria**:
  - Given [condition], When [action], Then [outcome]
  - [ ] [Tiêu chí đo lường được]
- **Dependencies**: none
- **Estimate**: [giờ — nếu tracking bật]

### ST-2: [Tên subtask]
- **Mô tả**: ...
- **Files thay đổi**: [...]
- **Acceptance Criteria**:
  - [ ] ...
- **Dependencies**: ST-1

<!-- Thêm subtasks theo nhu cầu. Tối đa ≤3 files, ≤4h per subtask -->

---

## Dependency Graph

```
ST-1 → ST-2 → ST-3
         ↓
        ST-4
```

---

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | | Thấp/TB/Cao | Thấp/TB/Cao | Kiểm chứng bằng: |
| 2 | Rủi ro kỹ thuật | | | | |
| 3 | Rủi ro security | | | | |

---

## Edge Cases

- [ ] [Edge case — khi nào xảy ra, xử lý thế nào]
- [ ] [Null/empty input]
- [ ] [Concurrent operations]
- [ ] [Rollback scenario]

---

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: [danh sách]
- **API changes**: [endpoints mới/sửa/xóa]
- **DB changes**: [migration cần thiết?]
- **Backward compatibility**: [Có / Không — nếu không: migration plan?]
- **Breaking changes**: [nếu có, ai bị ảnh hưởng]

---

## Góc Nhìn & Trade-offs

| Quyết định | User | Developer | Security | Ops |
|-----------|------|-----------|----------|-----|
| [Quyết định 1] | | | | |
