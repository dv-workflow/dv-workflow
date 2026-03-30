# As-Built Plan: lib

## Ngày tạo: 2026-03-29
## Loại: As-Built (Retroactive) — không phải forward plan
## Trạng thái: Done (implemented 2026-03-24 → 2026-03-26)

---

> ⚠ Đây là tài liệu retroactive — mô tả những gì ĐÃ được implement.

## Tóm Tắt Giải Pháp Đã Implement

Single-responsibility modules, mỗi file = 1 concern. Không có shared state, không có class, chỉ exported functions. External dependencies tối thiểu (js-yaml, chalk) — còn lại là Node built-ins.

## Những Gì Đã Implement

### config.mjs — YAML Config Layer
- `loadConfig(path)` → parse YAML, return object | null
- `writeConfig(path, data)` → dump object → YAML với consistent formatting
- `buildConfig({...})` → generate full config object với defaults (source of truth cho schema)
- `loadSchema(path)` → parse JSON Schema
- `getToolkitVersions(config)` → extract `_toolkit.*` version fields

### copy.mjs — File System Operations
- `ensureDir(dir)` → mkdir -p
- `copyFile(src, dst)` → copy single file, ensure parent dir exists
- `copyDir(src, dst, {overwrite})` → recursive copy, skip-if-exists by default, return results[]
- `copyWithOverrides(src, dst, overridesDir)` → copy với override priority (overrides dir wins)
- `diffDirs(src, dst)` → compare two dirs by content (Buffer.equals), return {added, modified, unchanged}

### ui.mjs — CLI Output + Input
- Output functions: `banner`, `header`, `log`, `ok`, `warn`, `err`, `info`, `dry`
- Color coding: green=ok, yellow=warn, red=err, cyan=info/banner
- Input: `ask(question, default)` → readline promise
- Input: `choose(question, options, default)` → validated single-select loop
- Input: `multiSelect(...)` → exported nhưng unused

### platform.mjs — Platform Detection
- `detectPlatform(cwd)` → priority: claude-cli (execSync) > cursor (file/env) > generic
- `platformLabel(platform)` → human-readable string
- Detection logic: subprocess-based (claude --version) + file-based (.cursor/) + env-based (CURSOR_SESSION_ID)

### prompt-suggest.mjs — Autocomplete
- `getSuggestions(cwd)` → merge git log (last 50 commits) + static templates, dedup, limit 20
- `getGitSuggestions(cwd)` → git log --oneline -50, strip hashes, filter length > 5
- `isVague(text)` → true nếu < 50 chars hoặc không có intent verb
- `expandTemplate(text, {area, outcome})` → join với newlines

### clipboard.mjs — Cross-platform Clipboard
- `copyToClipboard(text)` → try candidates theo platform, return bool success
- win32: `clip`, darwin: `pbcopy`, linux: `wl-copy` → `xclip` → `xsel`

### update-checker.mjs — Background Version Check
- Cache tại `~/.dw-kit/update-cache.json` (TTL: 24h)
- `getUpdateNotice(current)` → đọc cache (sync, không block), return latestVersion | null
- `scheduleUpdateCheck(current)` → fire-and-forget fetch to registry.npmjs.org, update cache
- Opt-out: `DW_NO_UPDATE_CHECK=1` env var

## Quyết Định Kỹ Thuật Đáng Chú Ý

| Quyết định | Approach | Lý do suy đoán |
|-----------|---------|----------------|
| Pure functions, no classes | Function exports | Simpler, easier to test, ESM-idiomatic |
| copyDir returns results[] | Caller inspects actions | Commands need to report skip counts to user |
| diffDirs dùng Buffer.equals() | Binary-safe comparison | Handles non-text files correctly |
| update-checker fire-and-forget | Không await | Không block CLI startup — UX priority |
| update-checker cache 24h | Không check mỗi lần | Tránh làm chậm CLI với network call |
| platform detection priority order | claude > cursor > generic | Claude CLI là target platform chính |

## Rủi Ro & Hạn Chế Đã Biết

| # | Mô tả | Mức độ | Trạng thái |
|---|-------|--------|-----------|
| 1 | 0% test coverage | Cao | Open |
| 2 | `copyWithOverrides` và `multiSelect` exported nhưng unused | Thấp | Open |
| 3 | `diffDirs` không detect deletions | TB | Open |
| 4 | `detectPlatform` spawns subprocess mỗi lần gọi | TB | Open |

## Edge Cases

- [x] `update-checker`: fail silently nếu offline hoặc registry down
- [x] `clipboard.mjs`: thử nhiều commands, return false nếu tất cả fail
- [x] `copyDir`: skip nếu source dir không tồn tại (return empty results)
- [ ] `diffDirs`: không handle symlinks
- [ ] `detectPlatform`: timeout 5s cho `claude --version` — có thể chậm trên một số systems
