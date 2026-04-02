# Context: update-checker

## Ngày khảo sát: 2026-03-26

## Yêu Cầu Gốc
Xây dựng tính năng update-checker cho dw-kit CLI: kiểm tra phiên bản mới trên npm registry và thông báo cho user khi có bản cập nhật.

## Files Liên Quan
| File | Vai trò | Cần thay đổi? | Ghi chú |
|------|---------|----------------|---------|
| `src/cli.mjs` | Entry point CLI, đăng ký commands | CÓ | Inject check vào flow chính |
| `bin/dw.mjs` | Bootstrap, Node version guard | CÓ | Có thể trigger check ở đây |
| `src/commands/upgrade.mjs` | Logic upgrade local files | KHÔNG | Đã có `--check` flag nhưng chỉ so sánh local versions |
| `src/commands/doctor.mjs` | Health check, so sánh local core vs toolkit | KHÔNG (tham khảo) | Có pattern so sánh version → tham khảo |
| `src/lib/config.mjs` | Load/write YAML config, `getToolkitVersions()` | KHÔNG | Utility dùng chung |
| `src/lib/ui.mjs` | Print helpers: ok, warn, err, info | KHÔNG | Dùng để hiển thị thông báo |
| `src/lib/platform.mjs` | Detect platform (claude-cli, cursor, generic) | KHÔNG | Tham khảo pattern |
| `package.json` | Khai báo version `1.0.1`, dependencies | KHÔNG | Version source of truth |
| `src/smoke-test.mjs` | Integration tests | CÓ | Cần thêm test case |
| `src/lib/update-checker.mjs` | **MỚI** — module thực hiện fetch + compare | TẠO MỚI | Core logic |

## Kiến Trúc Hiện Tại

```
bin/dw.mjs (bootstrap)
    └── src/cli.mjs (commander setup)
            ├── commands/init.mjs
            ├── commands/upgrade.mjs   ← có --check flag (local-only)
            ├── commands/validate.mjs
            ├── commands/doctor.mjs    ← so sánh local versions
            ├── commands/prompt.mjs
            └── commands/claude-vn-fix.mjs

lib/
    ├── config.mjs   ← getToolkitVersions(), loadConfig()
    ├── ui.mjs       ← ok(), warn(), err(), log()
    ├── copy.mjs     ← diffDirs(), copyFile()
    ├── platform.mjs ← detectPlatform()
    ├── clipboard.mjs
    └── prompt-suggest.mjs
```

**Luồng version check hiện tại (upgrade --check):**
- `upgrade.mjs` đọc `package.json` (toolkit version)
- So sánh `projectConfig._toolkit.core_version` với `toolkitConfig._toolkit.core_version`
- Đây là so sánh LOCAL: toolkit đã install vs project đang dùng
- KHÔNG có fetch npm registry

**Luồng cần xây dựng (update-checker):**
- Fetch `https://registry.npmjs.org/dw-kit/latest` (hoặc endpoint npm)
- So sánh `latestVersion` với `pkg.version` (local installed version)
- Thông báo nếu có bản mới

## Dependencies
**Upstream (update-checker phụ thuộc):**
- Node.js built-in: `node:https` hoặc `node:fetch` (Node >=18 có global fetch)
- `package.json`: lấy current version
- `src/lib/ui.mjs`: hiển thị warn/ok

**Downstream (những gì sẽ gọi update-checker):**
- `bin/dw.mjs` hoặc `src/cli.mjs`: trigger check khi chạy bất kỳ command nào
- Hoặc chỉ trong command `dw doctor` / `dw upgrade --check`

## Patterns & Conventions
- **ESM modules**: tất cả files dùng `.mjs` và `import/export`
- **Lazy import**: `cli.mjs` dùng `await import(...)` trong action handler (không import static)
- **Error handling**: guard clause, early return, không swallow errors
- **UI layer tách biệt**: không `console.log` trực tiếp trong commands — dùng `ui.mjs`
- **No external HTTP client**: project chỉ dùng `ajv`, `chalk`, `commander`, `enquirer`, `js-yaml` — không có `node-fetch`, `axios`. Node >=18 đã có global `fetch()`
- **Timeout pattern**: `platform.mjs` dùng `execSync(..., { timeout: 5000 })` — tương tự cần timeout cho fetch
- **Non-blocking design**: `doctor.mjs` exit code 1 khi có errors — update check KHÔNG nên block commands
- **Cache**: nhiều CLI tools dùng file cache để không fetch mỗi lần. Cần xem xét

## Giả Định & Hạn Chế
- **Giả định**: user có internet khi chạy CLI — cần handle offline gracefully (timeout + silent fail)
- **Giả định**: npm registry `https://registry.npmjs.org/dw-kit/latest` là nguồn đúng
- **Hạn chế**: Không có cơ chế cache hiện tại — nếu fetch mỗi lần sẽ slow down CLI
- **Chưa rõ**: Update check nên xuất hiện ở đâu — mọi command, hay chỉ `dw doctor`?
- **Chưa rõ**: User có muốn opt-out check không? (NO_UPDATE_CHECK env var?)
- **Hạn chế**: YAML comments bị mất khi `writeConfig()` — nếu cần persist last-checked timestamp vào config, sẽ mất comments

## Test Coverage Hiện Tại
- `src/smoke-test.mjs`: có test `upgrade --check` nhưng chỉ test local comparison
- Không có test nào cho network fetch hoặc version comparison logic
- Cần mock `fetch()` trong test vì smoke test không nên phụ thuộc network

## Ghi Chú

### Tham khảo pattern từ `doctor.mjs`:
```js
// doctor.mjs:79-83
if (versions.core !== toolkitVersions.core) {
  warn(`Update available: ${versions.core} → ${toolkitVersions.core} (run \`dw upgrade\`)`);
  warnings++;
}
```
Pattern tương tự dùng để thông báo npm update:
```js
warn(`New version available: ${current} → ${latest} (run \`npm install -g dw-kit\`)`);
```

### Node >=18 global fetch:
```js
// Không cần npm install thêm package
const res = await fetch('https://registry.npmjs.org/dw-kit/latest', { signal: AbortSignal.timeout(3000) });
const data = await res.json();
const latest = data.version; // e.g. "1.1.0"
```

### Semver comparison:
- Project chưa có `semver` package
- Có thể so sánh đơn giản với string compare (không đủ cho semver proper)
- Hoặc implement lightweight compare: split('.').map(Number) và so sánh [major, minor, patch]
- Cần tránh thêm dependency nặng chỉ cho feature này

### Recommended approach:
1. Tạo `src/lib/update-checker.mjs` với hàm `checkForUpdate(currentVersion)` → `{ hasUpdate, latest, current }`
2. Gọi async + non-blocking từ `bin/dw.mjs` sau khi parse xong (wrap in try-catch, silent fail)
3. Dùng `warn()` để hiển thị (không block, không exit code)
4. Optional: cache kết quả trong `.tmp/update-check-cache.json` với TTL 24h
5. Respect env var `DW_NO_UPDATE_CHECK=1` để opt-out
