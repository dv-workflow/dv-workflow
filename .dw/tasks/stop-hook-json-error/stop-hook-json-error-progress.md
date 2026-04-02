# Progress: stop-hook-json-error

## Trạng thái: Done
## Branch: —
## Bắt đầu: 2026-03-26
## Kết thúc: —

---

## Mô tả vấn đề

Stop hook (`type: "prompt"`) trong `.claude/settings.json` liên tục báo lỗi:
> `Stop hook error: JSON validation failed`

Hook hiện tại:
```json
{
  "type": "prompt",
  "prompt": "Check before stopping: any uncommitted important changes? ... Reply with ONLY valid JSON..."
}
```

Đã thử fix prompt ngắn gọn hơn (2026-03-26) nhưng lỗi vẫn còn.

## Phát Hiện (2026-03-26)

**Root cause xác định:** Harness-level issue — Stop hook nhận toàn bộ ARGUMENTS object thay vì chỉ prompt text. Hook không thể parse JSON từ bên trong object structure lớn hơn. Đây không phải lỗi prompt, không thể fix bằng cách chỉnh wording.

→ **`type: "prompt"` cho Stop hook không hoạt động đúng trong harness hiện tại.**

## Việc cần làm

- [x] Xóa Stop hook `type: "prompt"` khỏi `settings.json`
- [x] Thay bằng `type: "command"` + shell script
- [x] Script `.claude/hooks/stop-check.sh`: kiểm tra uncommitted changes + in-progress tasks, print warning ra stderr, exit 0 (không block)

## Blockers

(chưa có)
