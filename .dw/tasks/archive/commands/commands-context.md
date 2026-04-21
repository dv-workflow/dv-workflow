# Context: commands

## Ngày khảo sát: 2026-03-28
## Loại: Retroactive Documentation
## Người thực hiện: agent (dw-retroactive)

---

## Mô Tả Feature

`src/commands/` là tầng CLI interface của dw-kit: 6 async commands được đăng ký vào `commander.js` qua `src/cli.mjs`. Mỗi command là một thin orchestrator — không chứa logic nặng, delegate tất cả vào `src/lib/`. Phục vụ developer dùng `dw` CLI trực tiếp từ terminal.

## Codebase Analysis

### Files Liên Quan

| # | File | Command | Lines | Vai trò |
|---|------|---------|-------|---------|
| 1 | `src/commands/init.mjs` | `dw init` | 332 | Setup wizard — tạo toàn bộ project structure |
| 2 | `src/commands/upgrade.mjs` | `dw upgrade` | 262 | So sánh + upgrade toolkit files (3 layers) |
| 3 | `src/commands/claude-vn-fix.mjs` | `dw claude-vn-fix` | 267 | Patch Vietnamese IME bug trong Claude CLI |
| 4 | `src/commands/prompt.mjs` | `dw prompt` | 125 | Autocomplete + wizard build structured prompt |
| 5 | `src/commands/doctor.mjs` | `dw doctor` | 149 | Health check — validate files + config |
| 6 | `src/commands/validate.mjs` | `dw validate` | 102 | Validate `dw.config.yml` syntax + schema + semantic |

### Kiến Trúc

```
Terminal user
     ↓ dw <command> [options]
src/cli.mjs  (commander.js entry)
     ├── init        → init.mjs        → lib/config, lib/copy, lib/ui, lib/platform
     ├── upgrade     → upgrade.mjs     → lib/config, lib/copy, lib/ui
     ├── claude-vn-fix → claude-vn-fix.mjs → lib/ui, node:child_process, node:os
     ├── prompt      → prompt.mjs      → lib/prompt-suggest, lib/clipboard, lib/ui
     ├── doctor      → doctor.mjs      → lib/config, lib/platform, lib/ui
     └── validate    → validate.mjs    → lib/config, lib/ui, ajv
```

### Data Flow — init command (phức tạp nhất)

```
Input: CLI flags (--preset, --silent, --adapter) hoặc interactive prompts
     ↓
1. Guard: kiểm tra .dw/config/ đã tồn tại → hỏi reinit?
2. Collect config: 3 modes:
   - preset:      đọc từ PRESETS constant
   - silent:      đọc từ env vars (DW_NAME, DW_DEPTH, DW_ROLES, DW_LANG)
   - interactive: hỏi user qua inquirer
3. Detect platform: claude-cli / cursor / generic
4. setupProject():
   - copyCoreDocs()         → .dw/core/ (overwrite)
   - copyConfig()           → .dw/config/dw.config.yml (build từ answers)
   - copyAdapterStructure() → .dw/adapters/
   - copyClaudeFiles()      → .claude/ (skip existing)
   - copyCLAUDEmd()         → CLAUDE.md (skip existing)
   - createRuntimeDirs()    → .dw/tasks/, .dw/docs/, .dw/metrics/, .dw/reports/
   - updateGitignore()      → append dw-kit entries
Output: Project structure tại process.cwd()
```

### Data Flow — upgrade command

```
Input: --check / --dry-run / --layer [all|core|platform|capability]
     ↓
1. Guard: .dw/config/dw.config.yml phải tồn tại
2. Load versions: project config vs toolkit config
3. upgrade theo layer:
   - Layer 0 core:       diffDirs() → copy changed files
   - Layer 1 platform:   diffDirs() → skip nếu có override; merge settings.json
   - Layer 2 capability: noop (config-driven, no files)
4. upgradeScripts(), upgradeConfigSchema()
5. updateVersionTracking() → ghi version vào config
Output: files updated + version bump trong dw.config.yml
```

## Dependencies

### Upstream (commands phụ thuộc vào)
- `src/cli.mjs` — đăng ký và invoke commands
- `src/lib/config.mjs` — load/write YAML, buildConfig, getToolkitVersions
- `src/lib/copy.mjs` — copyDir, copyFile, ensureDir, diffDirs
- `src/lib/ui.mjs` — banner, ok, warn, err, info, log, ask, choose
- `src/lib/platform.mjs` — detectPlatform, platformLabel
- `src/lib/clipboard.mjs` — copyToClipboard
- `src/lib/prompt-suggest.mjs` — getSuggestions, isVague, expandTemplate
- `ajv` (external) — JSON Schema validation trong validate.mjs
- `js-yaml` (external) — parse YAML inline trong prompt.mjs

### Downstream (ai bị ảnh hưởng khi commands thay đổi)
- User's project structure — `init` tạo ra toàn bộ `.dw/`, `.claude/`
- `CLAUDE.md` của user project — `init` copy + append Tech Stack section
- Claude CLI binary — `claude-vn-fix` patch trực tiếp

## Git History

- **Tạo lần đầu**: 2026-03-24 (bbd9203 — `refactor: move core/, config/, adapters/ under .dw/`)
- **Commits**: 7 commits trong 3 ngày (2026-03-24 → 2026-03-26)
- **Maintainer chính**: solo contributor
- **Thay đổi đáng kể**:
  - `044f099` — major refactor v1.0.1: config schema update
  - `617a94d` — thêm `dw prompt` command
  - `e6bef0a` — thêm `dw claude-vn-fix` command
  - `8e633be` — fix bundle guard logic + rollback error handling

## Test Coverage

- **Có tests**: Không (không tìm thấy `*.test.mjs` hoặc `*.spec.mjs`)
- **Test files**: —
- **Coverage**: 0%
- **Gaps**: Tất cả commands chưa có unit/integration tests. Đây là tech debt lớn nhất.

## Giả Định & Hạn Chế

| # | Giả định/Hạn chế | Mức độ rủi ro |
|---|-----------------|--------------|
| 1 | `process.cwd()` là project root của user — không có validation | TB |
| 2 | `guessProjectName()` dùng last path segment — fail với paths lạ (trailing slash, UNC paths) | Thấp |
| 3 | `claude-vn-fix` giả định Claude CLI cài qua npm global — fail nếu cài theo cách khác | Cao |
| 4 | `upgrade.mjs` deepMerge không merge arrays — chỉ override | TB |
| 5 | `prompt.mjs` đọc adapter config với `yamlLoad` trực tiếp thay vì dùng shared `loadConfig()` | Thấp |

## Tech Debt & Warnings

- **Không có tests** — cả 6 commands không có test coverage
- **`claude-vn-fix` nguy hiểm**: patches third-party binary (`@anthropic-ai/claude-code/cli.js`) → bị break sau mỗi lần Claude CLI update
- **`deepMerge` trong upgrade.mjs**: arrays bị override thay vì merge — nếu user có thêm items trong settings.json array, chúng bị mất
- **Inconsistency nhỏ**: `prompt.mjs` dùng `yamlLoad` thay vì `loadConfig()` shared — nếu `loadConfig` thêm logic (caching, validation), `prompt.mjs` không được hưởng lợi

## Ghi Chú Cho AI

> Context quan trọng khi làm task liên quan commands:
- **`TOOLKIT_ROOT`** trong mỗi command = root của dw-kit package (không phải cwd) — dùng `import.meta.url` pattern. Đây là pattern quan trọng để resolve template paths
- **3 modes của `init`**: interactive (default), preset (`--preset`), silent (`--silent` + env vars). Mọi thay đổi UI flow phải xử lý cả 3 modes
- **Upgrade layers**: Layer 0 (core) luôn overwrite; Layer 1 (platform) skip nếu có override file; Layer 2 (capability) là noop. Đừng nhầm lẫn khi thêm upgrade logic
- **`copyClaudeFiles` skip pattern**: dùng `results.action === 'skip'` từ `copyDir` — preserve user customizations
- **`claude-vn-fix` là fragile**: không extend feature này mà không có strategy cho versioning của Claude CLI
