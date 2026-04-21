# Context: fix-stop-check-echo-newline

## Ngày khảo sát: 2026-04-02
## Nguồn: GitHub Issue #4 — dv-workflow/dv-workflow
## Linked Issue: https://github.com/dv-workflow/dv-workflow/issues/4

---

## Yêu Cầu Gốc

Bug report qua `/dw-kit-report`: Hook `stop-check.sh` in literal `\n` thay vì xuống dòng trên một số Linux distros.

```
Actual:   ⚠ Uncommitted changes:\n file1.md | 2 ++
Expected: ⚠ Uncommitted changes:
           file1.md | 2 ++
```

## Root Cause Analysis

### Files Liên Quan

| # | File | Vai trò | Vấn đề |
|---|------|---------|--------|
| 1 | `.claude/hooks/stop-check.sh` | Stop hook — warn uncommitted changes | 2 bugs: `\n` literal + `echo -e` không portable |

### Bug 1: `\n` literal trong bash array

```bash
# Line 13 — \n KHÔNG phải escape sequence trong double-quoted bash string
# khi gán vào array, nó là 2 ký tự: backslash + n
WARNINGS+=("Uncommitted changes:\n$CHANGED")
```

Bash chỉ interpret `\n` trong `$'...'` syntax (ANSI C quoting) hoặc `printf`.
Trong double-quoted string thông thường, `\n` là literal.

### Bug 2: `echo -e` không portable

```bash
# Line 31
echo -e "⚠ $w" >&2
```

`echo -e` behavior phụ thuộc vào shell implementation:
- **bash**: interpret `-e` → `\n` thành newline
- **dash** (Ubuntu/Debian default `/bin/sh`): KHÔNG interpret `-e` → print literal `-e`
- **zsh**: tùy config

Khi Claude Code chạy hook trên Ubuntu với dash, output sai.

## Tác Động

- Chỉ ảnh hưởng `Stop` hook — warning format
- Không blocking (warning vẫn hiện, chỉ format xấu)
- Ảnh hưởng: Linux users dùng dash làm default shell

## Giả Định

| # | Giả định | Kết quả |
|---|----------|---------|
| 1 | `$'\n'` (ANSI C quoting) portable trên bash | Đúng — POSIX bash |
| 2 | `printf "%b"` portable hơn `echo -e` | Đúng — POSIX standard |
