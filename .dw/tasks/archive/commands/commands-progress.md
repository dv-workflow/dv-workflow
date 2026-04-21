# Progress: commands

## Trạng thái: Done (Pre-dw Implementation)
## Loại: Retroactive Documentation
## Documented on: 2026-03-28

---

> Feature này đã được implement trước khi adopt dw-kit.
> File này được tạo retroactively để AI có context khi làm task liên quan.

## Implementation History (từ git)

| Thời điểm | Sự kiện | Commit |
|-----------|---------|--------|
| 2026-03-24 | Commands layer tạo lần đầu (init, upgrade, doctor, validate) | bbd9203 |
| 2026-03-24 | Major config schema refactor + reorganize under .dw/ | 044f099 |
| 2026-03-25 | Tiếp tục refactor + update docs | 59e72b4, 3be894d |
| 2026-03-26 | Thêm `dw claude-vn-fix` command | e6bef0a |
| 2026-03-26 | Thêm `dw prompt` command (autocomplete + wizard) | 617a94d |
| 2026-03-26 | Fix bundle guard logic + rollback error handling | 8e633be |

## Known Issues / Open Items

- [ ] **Không có tests** — tất cả 6 commands cần unit + integration tests
- [ ] **`claude-vn-fix` fragile** — patch third-party file, breaks after Claude CLI update
- [ ] **`deepMerge` arrays** — override thay vì merge trong `upgrade.mjs:mergeSettingsJson`
- [ ] **`prompt.mjs` inconsistency** — dùng `yamlLoad` trực tiếp thay vì shared `loadConfig()`

## Handoff Notes cho AI

Khi làm task liên quan commands:

- **Đọc trước**: `commands-context.md` — đặc biệt section Giả Định & Ghi Chú Cho AI
- **Pattern quan trọng**: `TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..')` — mọi path resolution dùng pattern này
- **Không thay đổi**: Export function name của mỗi command (`initCommand`, `upgradeCommand`, v.v.) — đã đăng ký trong `src/cli.mjs`
- **Cẩn thận**: `init` có 3 modes — thay đổi UI flow phải update cả 3
- **Cẩn thận**: `copyClaudeFiles` intentionally skip existing files — đừng thay thành overwrite
- **Có thể refactor**: `prompt.mjs:readAdapter()` → dùng shared `loadConfig()` từ `lib/config.mjs`
- **Có thể thêm**: Tests — đây là tech debt ưu tiên cao nhất
