# As-Built Plan: commands

## Ngày tạo: 2026-03-28
## Loại: As-Built (Retroactive) — không phải forward plan
## Trạng thái: Done (implemented 2026-03-24 → 2026-03-26)

---

> ⚠ Đây là tài liệu retroactive — mô tả những gì ĐÃ được implement,
> không phải plan cho việc sẽ làm. Dùng để AI và team hiểu context.

## Tóm Tắt Giải Pháp Đã Implement

Thin command layer với pattern: mỗi command = 1 file, 1 exported async function, orchestrate logic từ `src/lib/`. Commands không chứa business logic — chỉ collect input, delegate, format output.

## Những Gì Đã Implement

### Component 1: init — Setup Wizard
- **Files**: `src/commands/init.mjs` (332 lines)
- **3 execution modes**:
  - *Interactive*: prompts qua inquirer (default)
  - *Preset*: `--preset [solo-quick|small-team|enterprise]` → predefined config
  - *Silent*: `--silent` + env vars (`DW_NAME`, `DW_DEPTH`, `DW_ROLES`, `DW_LANG`) → CI/automation
- **Platform routing**: tự detect `claude-cli` / `cursor` / `generic` → copy files phù hợp
- **Safe copy**: `copyClaudeFiles` skip files đã tồn tại (preserve user customizations)
- **gitignore**: auto-append dw-kit entries nếu chưa có

### Component 2: upgrade — 3-Layer Upgrade
- **Files**: `src/commands/upgrade.mjs` (262 lines)
- **3 layers**:
  - *Layer 0 core*: `.dw/core/` — overwrite (methodology docs, user không customize)
  - *Layer 1 platform*: `.claude/` — skip nếu file có trong `.dw/adapters/claude-cli/overrides/`
  - *Layer 2 capability*: config-driven, không có file changes
- **Dry-run mode**: `--dry-run` → preview thay đổi mà không apply
- **Check mode**: `--check` → chỉ so sánh version
- **settings.json merge**: deepMerge template vào existing (objects merge, arrays override)
- **Extensions**: auto-install custom skills từ `.dw/adapters/claude-cli/extensions/`

### Component 3: claude-vn-fix — Vietnamese IME Patch
- **Files**: `src/commands/claude-vn-fix.mjs` (267 lines)
- **Mục đích**: Patch bug Backspace/Delete trong Claude CLI khi gõ tiếng Việt với IME
- **Approach**: Tìm và patch `@anthropic-ai/claude-code/cli.js` (binary third-party)
- **Backup**: tạo backup trước khi patch
- **Restore**: `--restore` flag để revert về backup
- **Dry-run**: `--dry-run` để preview patch

### Component 4: prompt — Autocomplete + Wizard
- **Files**: `src/commands/prompt.mjs` (125 lines)
- **2 modes**: interactive (default) hoặc `--text <text>` (non-interactive)
- **Autocomplete**: `enquirer AutoComplete` với suggestions từ `lib/prompt-suggest.mjs`
- **Wizard**: nếu description vague → hỏi thêm area + outcome
- **Output**: print result + copy to clipboard (adapter-aware)

### Component 5: doctor — Health Check
- **Files**: `src/commands/doctor.mjs` (149 lines)
- **Checks**: core files, config files, Claude files, adapter dirs, runtime dirs
- **Exit code**: 0 nếu no errors, 1 nếu có errors

### Component 6: validate — Config Validation
- **Files**: `src/commands/validate.mjs` (102 lines)
- **3 phases**: YAML syntax → JSON Schema (ajv) → semantic checks
- **Semantic rules**: 6 cross-field validations (e.g. PM role nhưng không có log_work)

## Quyết Định Kỹ Thuật Đáng Chú Ý

| Quyết định | Approach đã dùng | Lý do suy đoán |
|-----------|-----------------|----------------|
| ESM only | `.mjs` + `import/export` | Consistency với Node.js modern practices, no transpile step |
| TOOLKIT_ROOT | `resolve(fileURLToPath(import.meta.url), '..', '..', '..')` | ESM không có `__dirname` — pattern chuẩn |
| 3 init modes | interactive + preset + silent | Support cả human use và CI/automation |
| Skip không overwrite | `copyDir` trả về action results | Preserve user customizations |
| deepMerge settings | Object merge (không phải replace) | Additive upgrade — không mất settings của user |
| Layer architecture trong upgrade | core/platform/capability | Tách concern: methodology vs platform-specific vs config |

## Rủi Ro & Hạn Chế Đã Biết

| # | Mô tả | Mức độ | Trạng thái |
|---|-------|--------|-----------|
| 1 | Không có test coverage cho bất kỳ command nào | Cao | Open |
| 2 | `claude-vn-fix` patch third-party binary → break sau Claude update | Cao | Open |
| 3 | `deepMerge` arrays override (không merge) → user mất array items khi upgrade | TB | Open |
| 4 | `prompt.mjs` dùng `yamlLoad` thay vì shared `loadConfig()` | Thấp | Open |

## Edge Cases

- [x] `init` khi đã init rồi → hỏi reinit? (guard clause)
- [x] `upgrade` khi chưa init → exit với error message
- [x] `validate` khi không tìm thấy schema → warn + skip (không crash)
- [ ] `init` với path có trailing slash → `guessProjectName` có thể trả về empty string
- [ ] `claude-vn-fix` khi Claude cài qua non-npm method (brew, manual) → không tìm thấy file

## Tác Động Hệ Thống

- **Modules ảnh hưởng**: `src/lib/` (toàn bộ), `src/cli.mjs`
- **File system**: tạo/modify files trong `process.cwd()` của user (project dir)
- **External**: `claude-vn-fix` modify `~/.npm-global/` hoặc tương đương
- **Database**: không có
