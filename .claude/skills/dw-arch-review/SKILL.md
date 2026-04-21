---
name: dw:arch-review
description: "TL skill: Review kiến trúc và technical feasibility của plan. Approve hoặc request changes trước khi dev execute."
argument-hint: "[task-name]"
context: fork
agent: planner
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git log *)"
  - "Bash(git diff *)"
---

# Architecture Review

Task: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → `paths.tasks`, `workflow.default_depth`.
Skill này dành cho depth: `thorough` (TL role). Với `standard`, tùy TL quyết định.

## Role: Tech Lead

Bạn đang thực hiện với vai trò **Tech Lead**. Đây là checkpoint quan trọng trước khi team bắt đầu implement.

## Đọc Tài Liệu

1. Đọc requirements (nếu có): `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-requirements.md`
2. Đọc plan: `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`
3. Đọc context: `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md`
4. Đọc living docs (nếu có): `.dw/docs/ARCHITECTURE.md`, `.dw/docs/DECISIONS.md`

## Review Checklist

### Technical Feasibility
- [ ] Approach có khả thi trong codebase hiện tại không?
- [ ] Có tech debt nào block implementation không?
- [ ] Dependencies ngoài (libs, services) có sẵn sàng không?

### Architecture Alignment
- [ ] Giải pháp có phù hợp với kiến trúc hiện tại không?
- [ ] Có vi phạm principles (SOLID, DRY, separation of concerns) không?
- [ ] API design có nhất quán với patterns hiện tại không?

### Scale & Performance
- [ ] Có performance implications không?
- [ ] Query patterns có tối ưu không (N+1, missing index)?
- [ ] Caching strategy phù hợp?

### Security
- [ ] Authentication & authorization đúng không?
- [ ] Input validation đầy đủ chưa?
- [ ] Sensitive data được handle đúng không?

### Testing
- [ ] Plan có unit test strategy không?
- [ ] Integration test coverage đủ không?
- [ ] Có cần E2E tests không?

### Maintainability
- [ ] Code sẽ dễ maintain không?
- [ ] Có tạo tech debt không cần thiết không?
- [ ] Documentation plan đủ không?

### Subtask Breakdown
- [ ] Subtasks có đủ nhỏ và độc lập không?
- [ ] Dependency graph hợp lý không?
- [ ] Estimate có realistic không?

## Output — Architecture Decision

```markdown
# Architecture Review: [Task Name]

## Reviewer: TL | Date: [date]

## Quyết Định
**✅ APPROVED** / **🔄 APPROVED WITH CHANGES** / **❌ NEEDS REWORK**

## Technical Assessment

### Strengths
- [Điểm tốt của approach]

### Concerns

#### 🔴 Must Fix (trước khi execute)
- [ ] **[Concern 1]**: [mô tả] → Proposed fix: [gợi ý]

#### 🟡 Should Fix
- [ ] **[Concern 2]**: [mô tả]

#### 🔵 Nice to Have
- [ ] **[Suggestion]**: [mô tả]

## Architecture Decisions

### Decision: [Tiêu đề]
- **Context**: [tại sao cần quyết định]
- **Decision**: [đã chọn gì]
- **Consequences**: [ảnh hưởng]

## Điều Chỉnh Plan

[Nếu có thay đổi cần ghi vào plan]

## Next Steps

[Sau khi dev fix concerns] → có thể bắt đầu `/dw:execute $ARGUMENTS`
```

## Cập Nhật Plan

Nếu có changes → ghi nhận vào plan file:
- Thêm architectural decisions vào DECISIONS.md
- Cập nhật subtasks nếu cần
- Đổi trạng thái plan: Draft → Approved (hoặc ghi rõ cần rework gì)
