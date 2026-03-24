# Workflow Rules

## Config-Driven Behavior

Trước khi thực hiện bất kỳ skill nào, PHẢI đọc `.dw/config/dw.config.yml`:

1. Kiểm tra `flags.<skill_name>` — nếu `false` → KHÔNG chạy, thông báo user
2. Kiểm tra `level` — nếu skill yêu cầu level cao hơn → thông báo và hỏi user
3. Nếu flag = `"skip"` → cho phép nhưng không enforce

## Level Requirements

| Skill | Level 1 | Level 2 | Level 3 |
|-------|---------|---------|---------|
| task-init | yes | yes | yes |
| research | yes | yes | yes |
| plan | skip | yes | yes |
| execute | yes | yes | yes |
| commit | yes | yes | yes |
| review | no | yes | yes |
| debug | yes | yes | yes |
| estimate | no | skip | yes |
| log-work | no | skip | yes |
| living-docs | no | no | yes |
| dashboard | no | no | yes |
| handoff | skip | yes | yes |

## Flag Behavior

- `true` : Skill hoạt động và được enforce trong workflow
- `false` : Skill bị tắt, skip trong workflow chain
- `"skip"` : Skill có sẵn nhưng optional, user tự quyết định

## Collaboration Rules

### Khi làm việc cùng Human Dev
- DỪNG và hỏi trước khi: thay đổi architecture, xóa code, thay đổi API contract
- Ghi rõ trong progress: quyết định nào do agent, quyết định nào cần human
- Nếu phát hiện conflict với plan → DỪNG, cập nhật progress, hỏi user

### Khi bàn giao giữa sessions
- Luôn cập nhật progress file trước khi kết thúc
- Ghi rõ: đang ở subtask nào, blockers, context quan trọng
- Commit work-in-progress nếu có thay đổi đáng kể

## Multi-Role Workflow

```
BA: /dw-requirements → output: requirements doc
     ↓
TL: /dw-arch-review → output: architecture decision + approve
     ↓
Dev+Agent: /dw-task-init → /dw-research → /dw-plan → [TL approve] → /dw-execute
     ↓
QC: /dw-test-plan → manual/auto testing
     ↓
Dev+Agent: /dw-review → /dw-commit → PR
     ↓
PM: /dw-dashboard → project health view
```

Không phải mọi task đều cần full chain. Routing complexity quyết định.
