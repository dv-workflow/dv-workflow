# Agent Communication Protocol — dw-kit v1.2

## Mục Đích

Khi một task lớn cần nhiều "vai" khác nhau (researcher → planner → developer), việc ghi lại kết quả từng bước giúp:
- Team members (người hoặc agent) biết chính xác task đang ở đâu
- Audit trail rõ ràng: ai quyết định gì, lúc nào
- Session tiếp theo có thể tiếp tục mà không cần hỏi lại

## Convention: Reports Directory

```
.dw/tasks/[task-name]/
├── [name]-context.md      # Research findings
├── [name]-plan.md         # Implementation plan
├── [name]-progress.md     # Progress tracking
└── reports/               # Agent communication (v1.2+)
    ├── 260402-1430-from-researcher-to-planner-analysis.md
    ├── 260402-1500-from-planner-to-developer-subtask-1.md
    └── 260402-1600-from-developer-to-reviewer-pr-ready.md
```

**Filename format**: `[YYMMDD-HHMM]-from-[role]-to-[role]-[description].md`

## Status Codes

| Status | Nghĩa |
|--------|-------|
| `DONE` | Hoàn thành, output sẵn sàng để dùng |
| `DONE_WITH_CONCERNS` | Xong nhưng có điểm đáng chú ý / cần review |
| `BLOCKED` | Bị chặn, cần action từ bên ngoài để tiếp tục |
| `NEEDS_CONTEXT` | Thiếu thông tin, cần human confirm |

## Khi Nào Tạo Report

- Sau khi `dw-research` hoàn thành → report `from-researcher-to-planner`
- Sau khi `dw-plan` approved → report `from-planner-to-developer`
- Khi phát hiện blocker trong execute → report `from-developer-to-user` với `BLOCKED`
- Sau khi review xong → report `from-reviewer-to-developer`

## Khi Nào KHÔNG Cần Report

- Tasks `quick` depth (≤2 files, hotfix) → không cần overhead này
- Solo dev, single session → progress.md đã đủ
- Thông tin đã có trong context.md / plan.md → không duplicate

## Template

Dùng `.claude/templates/agent-report.md`

## Lưu Ý Quan Trọng

Reports là **cho con người đọc**, không phải protocol cho AI. Claude Code đã communicate qua conversation context. Reports giúp team members theo dõi task cross-session, không phải AI-to-AI messaging.
