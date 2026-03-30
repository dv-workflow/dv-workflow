# Progress: lib

## Trạng thái: Done (Pre-dw Implementation)
## Loại: Retroactive Documentation
## Documented on: 2026-03-29

---

## Implementation History (từ git)

| Thời điểm | Sự kiện | Commit |
|-----------|---------|--------|
| 2026-03-24 | config, copy, ui, platform tạo lần đầu | bbd9203 |
| 2026-03-26 | Thêm update-checker.mjs | ab27593 |
| 2026-03-26 | Thêm prompt-suggest.mjs, clipboard.mjs | 617a94d |

## Known Issues / Open Items

- [ ] 0% test coverage — ưu tiên: `config.mjs`, `copy.mjs:diffDirs()`
- [ ] `copyWithOverrides()` exported nhưng không được dùng — cân nhắc xóa hoặc document use case
- [ ] `multiSelect()` exported nhưng không được dùng — dead code
- [ ] `diffDirs()` không detect deletions — upgrade sẽ không clean up files bị xóa khỏi toolkit

## Handoff Notes cho AI

Khi làm task liên quan lib:
- **Đọc trước**: `lib-context.md` — đặc biệt section Ghi Chú Cho AI
- **Không thay đổi**: function signatures của `loadConfig`, `copyDir`, `diffDirs` — nhiều callers depend vào return shape
- **Cẩn thận**: `buildConfig()` là source of truth cho config schema — thay đổi ảnh hưởng `dw init`, `dw validate`, tests
- **Có thể xóa an toàn**: `copyWithOverrides()` nếu không có plan dùng nó; `multiSelect()` trong ui.mjs
- **Có thể thêm**: Tests — đặc biệt `diffDirs()` có logic phức tạp nhất cần coverage
- **`scheduleUpdateCheck()`**: không bao giờ await — fire-and-forget by design
