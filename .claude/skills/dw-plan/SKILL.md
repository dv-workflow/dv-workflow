---
name: dw:plan
description: "Lập kế hoạch implementation chi tiết sau khi đã research. Thiết kế giải pháp, phân chia subtasks, xác định rủi ro. DỪNG để chờ approval trước khi execute."
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Lập Kế Hoạch Implementation

Task: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → lấy:
- `paths.tasks` → location task docs
- `tracking.estimation` → có include estimation trong plan không
- `tracking.estimation_unit` → đơn vị (hours / story-points / t-shirt)
- `team.roles` → ai cần approve (có `techlead` → plan cần TL review)
- `workflow.default_depth` → `thorough` = cần arch-review trước execute

## QUAN TRỌNG
- KHÔNG implement bất cứ gì
- KHÔNG sửa code
- CHỈ đọc, phân tích, và viết plan
- DỪNG LẠI cuối cùng để chờ user/TL approve

## Detect Task Format (v1 vs v2)

Kiểm tra `{paths.tasks}/$ARGUMENTS/`:
- **v2**: có `spec.md` + `tracking.md` → plan output update trực tiếp vào `spec.md` (sections Scope/Subtasks/Risks/Success Criteria).
- **v1** (legacy): có `-context.md`/`-plan.md`/`-progress.md` → plan output ghi vào `$ARGUMENTS-plan.md`.
- Chưa có gì → gợi ý `/dw:task-init $ARGUMENTS` trước.

## Bước 1: Đọc Context

- **v2**: Đọc `{paths.tasks}/$ARGUMENTS/spec.md` (bao gồm section `## Research Findings` nếu đã chạy `/dw:research`).
- **v1**: Đọc `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md` — file research đã tạo.
- Nếu chưa có research findings → thông báo: "Cần chạy `/dw:research $ARGUMENTS` trước."

## Bước 2: Thiết kế giải pháp

### Xem xét phương án
- Liệt kê ÍT NHẤT 2 phương án khả thi
- So sánh trade-offs: complexity, performance, maintainability, timeline
- Chọn phương án tối ưu và giải thích lý do

### Áp dụng THINKING.md
1. **Critical Thinking**: Giả định nào? Rủi ro gì? Edge cases?
2. **Systems Thinking**: Tác động lên modules khác? Data flow thay đổi?
3. **Multiple Perspectives**: User? Developer? Security? Ops?

## Bước 3: Phân chia subtasks

Mỗi subtask PHẢI có:
- **Mô tả**: Cụ thể, actionable
- **Files**: Danh sách files cần thay đổi
- **Acceptance criteria**: Điều kiện hoàn thành rõ ràng
- **Dependencies**: Subtask nào phải xong trước
- **Estimate** (nếu `tracking.estimation = true`): Effort dự kiến theo `tracking.estimation_unit`

Thứ tự subtasks theo dependency graph:
1. Schema/data changes trước
2. Service/business logic tiếp
3. API/routes sau
4. Tests song song hoặc trước (TDD)
5. Docs cuối

## Bước 4: Viết plan

**v2**: Update `spec.md` trực tiếp — điền vào các section có sẵn:
- `## Scope → In Scope`: thêm ST-1, ST-2, ... với mô tả + acceptance + effort
- `## Scope → Out of Scope`: các điểm loại trừ rõ ràng
- `## Risks & Mitigations`: bảng risks
- `## Success Criteria`: tiêu chí measurable
- `## Dependencies`: blockers upstream / external
Frontmatter: đổi `status: Draft` → `status: Approved` chỉ SAU khi user approve.

**v1**: Ghi vào `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md` theo template:

```markdown
# Plan: [Task Name]

## Ngày tạo: [date]
## Trạng thái: Draft → cần approve

## Tóm Tắt Giải Pháp
[1-2 đoạn mô tả approach đã chọn]

## Phương Án Đã Xem Xét
| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|

## Subtasks
### ST-1: [Tên subtask]
- **Mô tả**: ...
- **Files**: ...
- **Criteria**: ...
- **Dependencies**: none
- **Estimate**: [nếu có]

### ST-2: [Tên subtask]
...

## Rủi Ro & Giả Định
| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|

## Edge Cases
- [ ] ...

## Tác Động Hệ Thống
- Modules ảnh hưởng: ...
- API changes: ...
- Migration: ...
- Backward compatibility: ...

## Góc Nhìn & Trade-offs
| Quyết định | User | Dev | Security |
|-----------|------|-----|----------|

## Estimation Tổng (nếu enabled)
- Research: [done]
- Planning: [done]
- Coding: [estimate]
- Testing: [estimate]
- Review: [estimate]
- Total: [sum]
```

## Bước 5: DỪNG & Trình bày

Trình bày plan cho user với:
1. Tóm tắt approach (3-5 câu)
2. Số subtasks và estimate tổng (nếu có)
3. Top 2 risks
4. Yêu cầu: "Approve plan này để tiếp tục `/dw:execute $ARGUMENTS`"

Nếu team có TL: "Plan cần TL review trước khi execute."
