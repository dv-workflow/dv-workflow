# Plan: fix-stop-check-echo-newline

## Ngày tạo: 2026-04-02
## Trạng thái: Approved (simple bug — white-bot direct propose)
## Linked Issue: https://github.com/dv-workflow/dv-workflow/issues/4
## Approved by: huygdv (TechLead)

---

## Tóm Tắt Giải Pháp

Fix 2 dòng trong `stop-check.sh`:
1. Thay `\n` literal trong bash array bằng `$'\n'` (ANSI C quoting)
2. Thay `echo -e` bằng `printf "%b"` (POSIX portable)

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | `$'\n'` + `printf "%b"` | POSIX portable, bash best practice | Cú pháp ít quen | **Chọn** |
| 2 | Dùng `$()` subshell với `echo` | Quen thuộc hơn | Vẫn không portable với dash | Loại |
| 3 | Rewrite dùng heredoc | Rõ ràng | Over-engineering cho 2 dòng fix | Loại |

## Subtasks

### ST-1: Fix stop-check.sh
- **File**: `.claude/hooks/stop-check.sh`
- **Change 1** (line 13):
  ```bash
  # Trước
  WARNINGS+=("Uncommitted changes:\n$CHANGED")
  # Sau
  WARNINGS+=("Uncommitted changes:"$'\n'"$CHANGED")
  ```
- **Change 2** (line 31):
  ```bash
  # Trước
  echo -e "⚠ $w" >&2
  # Sau
  printf "⚠ %b\n" "$w" >&2
  ```
- **Acceptance Criteria**:
  - [ ] Output xuống dòng đúng sau "Uncommitted changes:"
  - [ ] Hoạt động đúng trên bash và dash
  - [ ] Không thay đổi behavior khác của hook
- **Dependencies**: none

## Rủi Ro

Không có — fix tối thiểu, không thay đổi logic.

## Evolution Process

Task này đi qua **simple bug flow** của dw-kit-evolve:
```
Issue #4 created (dw-kit-report)
  → Triage: type=bug, component=hooks, impact=degraded → Simple
  → white-bot propose fix (direct, không adversarial)
  → TL approve
  → Fix applied + commit
  → Issue closed
```
