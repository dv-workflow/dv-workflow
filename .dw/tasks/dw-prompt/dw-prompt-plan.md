# Plan: dw-prompt

## Ngày tạo: 2026-03-26
## Trạng thái: Approved
## Approved by: human (implicit via /dw-execute)

---

## Tóm Tắt Giải Pháp

Thêm command `dw prompt` — Progressive Prompt Builder với 3 lớp kết hợp:
1. **Autocomplete** (Option C): suggest từ git log + predefined templates khi user gõ
2. **Guided wizard** (Option A): 1-2 câu hỏi optional, chỉ trigger khi description mơ hồ
3. **Template expand** (Option B): structure output thành prompt chuẩn — adapter-agnostic, không gọi API

Output format tuỳ adapter. Flag `--api` opt-in cho AI enhance. Scope này: independent command trước, tích hợp `dw task-init` ở iteration sau.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | Progressive (C+A+B, template-based) | Universal, zero API dependency, adapter-agnostic | Suggestions không generative | **Chọn** |
| 2 | API-first enhance | Output chất lượng cao hơn | Cần API key, latency, cost, không works offline | Loại — API là opt-in flag |
| 3 | Chỉ wizard (A) | Đơn giản nhất | Mất UX suggest, tedious | Loại — kết hợp cả 3 tốt hơn |

## Subtasks

### ST-1: Extract clipboard helper
- **Mô tả**: Tạo `src/lib/clipboard.mjs` chứa `copyToClipboard(text)` — tái sử dụng logic từ vn-hybrid đã xóa
- **Files**: `src/lib/clipboard.mjs` (tạo mới)
- **Acceptance Criteria**:
  - [ ] Works trên win32 (`clip`), darwin (`pbcopy`), linux (`wl-copy`, `xclip`, `xsel`)
  - [ ] Trả về `boolean` (success/fail)
  - [ ] Graceful fallback nếu không có clipboard tool
- **Dependencies**: none

### ST-2: Build suggestion engine
- **Mô tả**: Tạo `src/lib/prompt-suggest.mjs` — lấy suggestions từ git log và predefined templates
- **Files**: `src/lib/prompt-suggest.mjs` (tạo mới)
- **Acceptance Criteria**:
  - [ ] `getGitSuggestions(cwd)` — parse `git log --oneline -50`, extract subject, dedupe, return array
  - [ ] `getTemplateSuggestions()` — trả predefined list theo 4 loại: fix, feat, refactor, perf
  - [ ] `getSuggestions(cwd)` — merge git + template, limit 20 items
  - [ ] Graceful fallback nếu không có git hoặc không có commits
- **Dependencies**: none

### ST-3: Build vagueness detector + template expander
- **Mô tả**: Logic detect prompt mơ hồ và expand thành structured output
- **Files**: `src/lib/prompt-suggest.mjs` (thêm vào ST-2)
- **Acceptance Criteria**:
  - [ ] `isVague(text)` — true nếu `length < 50` hoặc không có verb
  - [ ] `expandTemplate(text, extras)` — nhận description + optional {area, outcome}, trả structured string
  - [ ] Output format: `"<description> in <area>.\nExpected: <outcome>."`
  - [ ] Hoạt động khi `extras` rỗng (output chỉ có description)
- **Dependencies**: ST-2

### ST-4: Implement `dw prompt` command handler
- **Mô tả**: Tạo `src/commands/prompt.mjs` — core UX flow với enquirer autocomplete + optional wizard + template expand
- **Files**: `src/commands/prompt.mjs` (tạo mới)
- **Acceptance Criteria**:
  - [ ] `--text <text>` flag — non-interactive mode, skip autocomplete/wizard, chỉ expand + output
  - [ ] Interactive mode: autocomplete input với suggestions từ ST-2
  - [ ] Trigger wizard nếu `isVague(input)` → hỏi "Which area?" và "Expected outcome?" (Enter to skip)
  - [ ] Template expand output
  - [ ] Copy to clipboard nếu adapter = `claude-cli` hoặc `cursor`
  - [ ] `--api` flag placeholder (log "API enhance not yet implemented" nếu dùng)
  - [ ] Đọc adapter từ `.dw/config/dw.config.yml` nếu tồn tại, fallback `claude-cli`
- **Dependencies**: ST-1, ST-3

### ST-5: Register command + smoke tests
- **Mô tả**: Đăng ký `dw prompt` trong cli.mjs, thêm smoke tests, update README
- **Files**: `src/cli.mjs`, `src/smoke-test.mjs`, `README.md`
- **Acceptance Criteria**:
  - [ ] `dw prompt --text "fix login"` chạy được, output structured prompt
  - [ ] `dw prompt --help` hiển thị đúng options
  - [ ] `--help lists all commands` test include `prompt`
  - [ ] Smoke test: `--text` mode với input ngắn → có wizard expand; input dài → skip wizard
  - [ ] README cập nhật section CLI commands
- **Dependencies**: ST-4

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | `enquirer` chưa là dependency | TB | TB | Kiểm tra package.json trước ST-4; nếu chưa có thì add |
| 2 | Rủi ro | enquirer interactive không hoạt động trong CI/pipe | Cao | Thấp | `--text` flag luôn là non-interactive fallback |
| 3 | Rủi ro | git log unavailable (non-git dir, no commits) | TB | Thấp | Graceful fallback về template-only suggestions |
| 4 | Giả định | Adapter field tồn tại trong dw.config.yml | TB | Thấp | Fallback `claude-cli` nếu không đọc được |

## Edge Cases

- [ ] Không có `.dw/config/dw.config.yml` → chạy được, dùng defaults
- [ ] Chạy ngoài git repo → skip git suggestions, dùng templates only
- [ ] Git repo nhưng 0 commits → getGitSuggestions trả `[]`
- [ ] User Enter ngay (empty input) → prompt lại hoặc exit gracefully
- [ ] `--text ""` (empty string) → error message, exit 1
- [ ] Clipboard unavailable → fallback log text ra stdout

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: `cli.mjs`, `smoke-test.mjs`, `README.md`
- **Files mới**: `src/commands/prompt.mjs`, `src/lib/clipboard.mjs`, `src/lib/prompt-suggest.mjs`
- **API changes**: Không có
- **Database changes**: Không có
- **Backward compatibility**: Có — command mới, không thay đổi existing commands
- **Breaking changes**: Không có
- **New dependency**: `enquirer` (cần confirm chưa có trong package.json)

## Góc Nhìn & Trade-offs

| Quyết định | User impact | Developer impact | Security | Ops/Deploy |
|-----------|-------------|------------------|----------|------------|
| Template-based (không API) | Instant, offline-capable | Dễ maintain | Không expose data ra ngoài | Zero config |
| `--api` opt-in | Power users có option nâng cao | Cần implement sau | Key management là trách nhiệm user | Không ảnh hưởng CI |
| enquirer cho interactive | UX tốt, familiar | Thêm 1 dependency | Không có concern | Cần graceful degradation trong non-TTY |
