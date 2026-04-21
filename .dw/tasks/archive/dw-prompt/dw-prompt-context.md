# Context: dw-prompt

## Ngày khảo sát: 2026-03-26
## Người thực hiện: agent

---

## Yêu Cầu Gốc

> Thêm command `dw prompt` — Progressive Prompt Builder giúp user viết task description tốt hơn khi gõ prompt vào Claude CLI (hoặc IDE khác). Ba lớp kết hợp:
> - **Option C**: Autocomplete từ git log + predefined templates khi user gõ
> - **Option A**: Guided wizard (1-2 câu hỏi optional) chỉ trigger khi description mơ hồ/ngắn
> - **Option B**: Template-based structuring (không gọi API — adapter-agnostic)
>
> Output copy to clipboard, format tuỳ adapter config (`claude-cli | cursor | generic`).
> Flag `--api` là opt-in explicit cho user muốn AI enhance, không phải default.

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Cần thay đổi? | Ghi chú |
|---|------|---------|----------------|---------|
| 1 | `src/cli.mjs` | Đăng ký command | Có | Thêm `dw prompt` command |
| 2 | `src/commands/prompt.mjs` | Command handler | Tạo mới | Core logic |
| 3 | `src/lib/ui.mjs` | UI helpers | Xem xét | Có thể cần helper mới |
| 4 | `src/smoke-test.mjs` | Smoke tests | Có | Thêm test cases |
| 5 | `README.md` | Docs | Có | Document command mới |

### Kiến Trúc Hiện Tại

```
src/cli.mjs
  └─ registers commands (init, upgrade, validate, doctor, claude-vn-fix)
       └─ each command = src/commands/<name>.mjs

src/lib/ui.mjs       → header(), info(), ok(), warn(), err(), log()
src/lib/adapter.mjs  → (cần kiểm tra tồn tại không)
```

### Data Flow

- **Input**: User gõ partial description → autocomplete suggest → optional wizard → template expand
- **Processing**: git log extraction + template matching + vagueness detection + string structuring
- **Output**: Structured prompt string → clipboard / stdout (theo adapter)
- **Storage**: Không có persistent storage (history là optional, lưu local file nếu implement)

## Dependencies

### Upstream
- [ ] `enquirer` hoặc `@inquirer/prompts` — interactive autocomplete input
- [ ] `git log` — nguồn suggestion từ commit history
- [ ] Adapter config từ `.dw/config/dw.config.yml`

### Downstream
- [ ] `dw task-init` — có thể tích hợp sau (dùng output của `dw prompt` làm description)
- [ ] README.md — cần cập nhật

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ (file:line) |
|---------|--------|--------------------|
| Command handler | Export async function, opts param | `claude-vn-fix.mjs:10` |
| Return `{ok, message}` thay vì throw | Error handling pattern | `claude-vn-fix.mjs:114` |
| `ui.mjs` cho output | Không dùng `console.log` trực tiếp | Toàn codebase |
| Dynamic import | Lazy load command trong cli.mjs | `cli.mjs:75` |

## Test Coverage Hiện Tại

- [ ] Smoke tests có cho các commands: init, validate, doctor, upgrade, claude-vn-fix
- Test files: `src/smoke-test.mjs`
- Coverage: Functional smoke test (không unit test)
- Gaps: Cần thêm test cho `dw prompt` với `--text` flag (non-interactive)

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | `enquirer` hoặc `@inquirer/prompts` chưa là dependency | Có — kiểm tra package.json | Cần add dependency hoặc chọn lib khác |
| 2 | `git log` available trong môi trường user | Có — non-git dir cần fallback | Disable git suggestions gracefully |
| 3 | Adapter info đọc được từ dw.config.yml | Có — kiểm tra schema | Fallback về `claude-cli` |
| 4 | Clipboard API hoạt động (đã có pattern từ vn-hybrid) | Không — đã verify trong codebase | Dùng lại logic `copyToClipboard` |

## Hạn Chế Đã Biết

- Inline real-time autocomplete (như IDE) không khả thi trong Node CLI thông thường — dùng `enquirer` list/autocomplete thay thế
- `enquirer` autocomplete chỉ hỗ trợ predefined list, không generative — cần build suggestion list từ git log + templates trước

## Chưa Rõ / Cần Làm Rõ

- [ ] `enquirer` vs `@inquirer/prompts` — lib nào nhẹ hơn, UX tốt hơn cho autocomplete? Cần kiểm tra
- [ ] `src/lib/adapter.mjs` có tồn tại không? Hay adapter info chỉ đọc từ config?
- [ ] Có nên tích hợp vào `dw task-init` ngay ở scope này không, hay để independent command trước?

## Ghi Chú Bổ Sung

- Logic `copyToClipboard` đã có trong `vn-hybrid.mjs` (đã xóa) — cần extract vào `src/lib/clipboard.mjs` hoặc `ui.mjs` để tái sử dụng
- Template suggestions nên cover 4 loại chính: `fix`, `feat`, `refactor`, `perf` — match với commit types hiện tại
- Vagueness detection: `description.length < 50` OR không có verb → trigger wizard
