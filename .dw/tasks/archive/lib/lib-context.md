# Context: lib

## Ngày khảo sát: 2026-03-29
## Loại: Retroactive Documentation
## Người thực hiện: agent (dw-retroactive)

---

## Mô Tả Feature

`src/lib/` là shared utilities layer của dw-kit CLI — 7 modules nhỏ, mỗi module làm một việc duy nhất. Không có business logic, không có state. Phục vụ tất cả commands trong `src/commands/` như thin infrastructure layer.

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Lines | Exported API |
|---|------|---------|-------|-------------|
| 1 | `config.mjs` | Load/write/build YAML config | 75 | `loadConfig`, `writeConfig`, `buildConfig`, `loadSchema`, `getToolkitVersions` |
| 2 | `copy.mjs` | File/dir copy, diff, override | 110 | `ensureDir`, `copyFile`, `copyDir`, `copyWithOverrides`, `diffDirs` |
| 3 | `ui.mjs` | CLI output + interactive prompts | 66 | `banner`, `header`, `log`, `ok`, `warn`, `err`, `info`, `dry`, `ask`, `choose`, `multiSelect` |
| 4 | `platform.mjs` | Detect AI platform (claude/cursor/generic) | 39 | `detectPlatform`, `platformLabel` |
| 5 | `prompt-suggest.mjs` | Autocomplete suggestions + vague detection | 84 | `getSuggestions`, `getGitSuggestions`, `isVague`, `expandTemplate` |
| 6 | `clipboard.mjs` | Cross-platform clipboard copy | 24 | `copyToClipboard` |
| 7 | `update-checker.mjs` | npm registry version check + cache | 73 | `getUpdateNotice`, `scheduleUpdateCheck` |

### Kiến Trúc

```
src/commands/* (consumers)
     │
     ├── config.mjs       ← js-yaml wrapper (no side effects beyond file I/O)
     ├── copy.mjs         ← node:fs wrapper (recursive, overwrite-aware, diff-capable)
     ├── ui.mjs           ← chalk + readline (console output + interactive input)
     ├── platform.mjs     ← execSync + existsSync (detect claude-cli / cursor / generic)
     ├── prompt-suggest.mjs ← git log + static templates (autocomplete source)
     ├── clipboard.mjs    ← spawnSync (platform-specific clipboard commands)
     └── update-checker.mjs ← fetch + fs cache at ~/.dw-kit/ (background npm check)
```

### Data Flow đáng chú ý

**update-checker flow** (non-blocking):
```
cli.mjs startup
  → getUpdateNotice()     reads ~/.dw-kit/update-cache.json (sync, fast)
  → scheduleUpdateCheck() fires async fetch to registry.npmjs.org (non-blocking)
      → on success: writeCache() cập nhật ~/.dw-kit/update-cache.json
cli.mjs teardown
  → nếu latestVersion tồn tại → print update notice
```

**platform detection flow**:
```
detectPlatform(cwd)
  → execSync('claude --version')  ← có I/O cost (subprocess)
      success → 'claude-cli'
      fail → isCursorProject(cwd)
          → existsSync('.cursor') hoặc CURSOR_SESSION_ID env
              true → 'cursor'
              false → 'generic'
```

**diffDirs flow** (upgrade.mjs):
```
diffDirs(sourceDir, targetDir)
  → walk() recursively reads source
  → mỗi file: compare Buffer content (readFileSync().equals())
  → classify: added | modified | unchanged
  → không check files ở target mà không có ở source (deletions ignored)
```

## Dependencies

### Upstream (lib phụ thuộc vào)
- `js-yaml` — YAML parse/dump (config.mjs)
- `chalk` — terminal colors (ui.mjs)
- `node:fs`, `node:path`, `node:os`, `node:child_process` — Node built-ins
- `fetch` (Node.js 18 built-in) — npm registry check (update-checker.mjs)

### Downstream (ai dùng lib)
- `src/commands/init.mjs` — config, copy, ui, platform
- `src/commands/upgrade.mjs` — config, copy, ui
- `src/commands/doctor.mjs` — config, platform, ui
- `src/commands/validate.mjs` — config, ui
- `src/commands/prompt.mjs` — ui, clipboard, prompt-suggest, platform
- `src/commands/claude-vn-fix.mjs` — ui
- `src/cli.mjs` — update-checker

## Git History

- **Tạo lần đầu**: 2026-03-24 (bbd9203)
- **Commits**: 3 commits (2026-03-24 → 2026-03-26)
- **Maintainer chính**: solo contributor
- **Thay đổi đáng kể**:
  - `ab27593` — thêm `update-checker.mjs` (mới hoàn toàn)
  - `617a94d` — thêm `prompt-suggest.mjs`, `clipboard.mjs` (mới)

## Test Coverage

- **Có tests**: Không
- **Test files**: —
- **Coverage**: 0%
- **Gaps**: Tất cả 7 lib modules chưa có tests. Ưu tiên: `config.mjs`, `copy.mjs`, `diffDirs()`

## Giả Định & Hạn Chế

| # | Giả định/Hạn chế | Mức độ rủi ro |
|---|-----------------|--------------|
| 1 | `detectPlatform()` gọi `execSync('claude --version')` mỗi lần — có subprocess overhead | TB |
| 2 | `update-checker` viết vào `~/.dw-kit/` — fail silently nếu không có quyền ghi | Thấp |
| 3 | `diffDirs()` không detect files bị xóa ở source (deletions not surfaced) | TB |
| 4 | `isVague()` dùng 50-char threshold — subjective, có thể false positive/negative | Thấp |
| 5 | `clipboard.mjs` Linux: thử wl-copy → xclip → xsel — fail nếu không cài tool nào | TB |
| 6 | `update-checker` dùng `fetch` (Node 18+) — không có fallback cho Node <18 | Thấp (engines guard) |

## Tech Debt & Warnings

- **Không có tests** — 7 modules, 0% coverage
- **`copyWithOverrides()` trong copy.mjs**: export ra nhưng không được dùng bởi bất kỳ command nào hiện tại — potential dead code hoặc dùng trong tương lai
- **`multiSelect()` trong ui.mjs**: export ra nhưng không được dùng anywhere — dead code hoặc future use
- **`detectPlatform()` cold start**: mỗi lần gọi đều spawn subprocess `claude --version` (5s timeout) — nếu gọi nhiều lần sẽ chậm
- **`diffDirs()` chỉ detect added/modified**, không detect removed — nếu toolkit xóa file, upgrade sẽ không clean up ở project

## Ghi Chú Cho AI

> Context quan trọng khi làm task liên quan lib:
- **Tất cả lib exports là pure functions** (hoặc có side effects được documented rõ) — an toàn để test trong isolation
- **`config.mjs:buildConfig()`** là source of truth cho config schema — khi thêm config field mới, luôn update ở đây trước
- **`copy.mjs:copyDir()` returns results array** — callers dùng `results.filter(r => r.action === 'skip')` để biết files được preserved
- **`update-checker.mjs`**: `scheduleUpdateCheck()` phải là **fire-and-forget** — không bao giờ await, không để block CLI startup
- **`detectPlatform()` có I/O cost** — chỉ gọi một lần per command execution, không gọi trong loop
- **`diffDirs()` compare bằng Buffer.equals()** — correct cho binary files, nhưng không detect encoding differences
