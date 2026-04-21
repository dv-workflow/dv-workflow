<!-- core-version: 1.0 -->

# Team Roles & Authority

> **Nguyên tắc**: Roles = capabilities, không phải hierarchy.
> Config `team.roles` quyết định phases nào available, không phải quality tier.

---

## Role Overview

| Role | Ký hiệu config | Core responsibility | Decision authority |
|------|----------------|--------------------|--------------------|
| Developer | `dev` | Implementation, testing | Code-level decisions |
| Tech Lead | `techlead` | Architecture, code standards | Architecture decisions, plan approval |
| Business Analyst | `ba` | Requirements, user stories | Requirements sign-off |
| QC Engineer | `qc` | Test planning, quality verification | QA sign-off (Layer 4) |
| Product Manager | `pm` | Progress visibility, metrics | Sprint planning, backlog priority |

> `dev` luôn required. Các roles khác là optional — không có thì phase đó gracefully degrade.

---

## Developer (`dev`)

**Trách nhiệm chính**: Research → Plan → Execute → Commit

### Phases Developer Owns

| Phase | Responsibility |
|-------|---------------|
| Initialize | Tạo task docs, scope assessment |
| Understand | Codebase research, context gathering |
| Plan | Solution design, subtask breakdown |
| Execute | Implementation, TDD, subtask commits |
| Verify | Self-review (Layer 1), automated gates (Layer 2) |
| Close | Commit, effort log, handoff |

### Decision Authority

- Code implementation decisions
- Library/dependency choices (minor)
- Subtask ordering và approach (trong scope của plan approved)
- **DỪNG và hỏi khi**: architecture change, API contract change, scope expansion

### Best Practices

- Commit nhỏ, thường xuyên (mỗi subtask = 1 commit)
- Update progress file sau mỗi subtask
- Không implement ngoài scope plan đã approve
- Phát hiện giả định sai → ghi Changelog + hỏi TL trước khi tiếp tục

---

## Tech Lead (`techlead`)

**Trách nhiệm chính**: Architecture quality, standards enforcement, plan approval

### Phases TL Owns

| Phase | Responsibility |
|-------|---------------|
| Plan | Architecture review, approve plan trước Execute |
| Execute | Unblock architecture decisions during implementation |
| Verify | Code review (Layer 3 — architecture focus) |
| Close | Final technical sign-off |

### Decision Authority

- Architecture decisions (service boundaries, patterns, data models)
- Plan approval: **explicit gate** — Execute không bắt đầu khi chưa có TL approve
- A/B testing resolution: TL chọn approach khi hai approaches không rõ ưu/nhược
- Technical debt acknowledgment: quyết định "acceptable" hay "must fix"

### Architecture Review Checklist

```
[ ] Approach consistent với codebase patterns?
[ ] Scalability implications acceptable?
[ ] Security design đúng?
[ ] API contract backward compatible (hoặc migration plan có)?
[ ] Subtask breakdown hợp lý? Dependencies đúng?
[ ] Risks identified và có mitigation?
```

### TL không có?

- Plan vẫn proceed nhưng developer self-review architecture decisions
- Ghi rõ trong plan: "Architecture decision by dev (no TL review)"
- Architecture decisions nên bảo thủ hơn khi không có TL

---

## Business Analyst (`ba`)

**Trách nhiệm chính**: Requirements clarity, user stories, acceptance criteria

### Phases BA Owns

| Phase | Responsibility |
|-------|---------------|
| Initialize | Requirements gathering, user stories |
| Plan | Review subtask acceptance criteria |
| Verify | Acceptance criteria verification |

### Decision Authority

- Requirements sign-off: "dev builds the right thing"
- Scope boundary: in-scope vs out-of-scope
- Acceptance criteria: testable, specific, agreed

### Requirements Output Format

```markdown
## User Story
As a [role], I want [goal] so that [benefit].

## Acceptance Criteria
Given [precondition]
When [action]
Then [outcome]

## Out of Scope
- [explicitly excluded items]

## Edge Cases to Handle
- [edge case 1]
- [edge case 2]
```

### BA không có?

- Developer writes requirements từ conversation với stakeholder
- Requirements review là developer + TL (không có independent BA)
- Risk cao hơn về misunderstood requirements — tăng frequency of check-ins

---

## QC Engineer (`qc`)

**Trách nhiệm chính**: Test planning, independent quality verification

### Phases QC Owns

| Phase | Responsibility |
|-------|---------------|
| Plan | Test plan tạo song song với dev plan |
| Verify | Execute test plan, Layer 4 sign-off |

### Decision Authority

- QA sign-off: **explicit gate** cho `thorough` depth — không thể self-approve
- Bug severity classification
- Regression scope: gì cần test lại sau change

### Test Plan Structure

```markdown
## Test Cases
### TC-1: [Test case name]
- **Given**: [precondition]
- **When**: [action]
- **Then**: [expected result]
- **Priority**: P1/P2/P3

## Regression Checklist
- [ ] [Feature 1 không bị ảnh hưởng]
- [ ] [Feature 2 không bị ảnh hưởng]

## Security Checklist (nếu applicable)
- [ ] Input validation
- [ ] Auth/authz checks
- [ ] No data exposure

## Performance Checklist (nếu applicable)
- [ ] Response time acceptable
- [ ] No N+1 queries introduced
```

### QC không có?

- Developer tự execute test plan (nếu có) hoặc manual verification
- Layer 4 QA sign-off skip — nhưng automated gates (Layer 4a) vẫn chạy
- Risk cao hơn về undiscovered bugs

---

## Product Manager (`pm`)

**Trách nhiệm chính**: Progress visibility, metrics, sprint planning

### Phases PM Owns

| Phase | Responsibility |
|-------|---------------|
| Initialize | Sprint planning, priority |
| Close | Sprint review, velocity tracking |
| Standalone: Reports | Dashboard generation |

### PM View

PM không cần đọc code — PM đọc:
- Progress files (status per subtask)
- Dashboard reports (velocity, metrics)
- Sprint review summaries

### Dashboard Metrics

| Metric | Source | Update frequency |
|--------|--------|-----------------|
| Tasks: done/in-progress/blocked | Progress files | Real-time |
| Velocity | Closed tasks per sprint | Per sprint |
| Estimate accuracy | Estimate vs actual | Per task |
| DORA: deployment frequency | Git history | Per release |
| DORA: lead time | Task start → deploy | Per release |

---

## Multi-Role Workflow

Full team workflow (tất cả roles):

```
BA: /dw:requirements     → requirements doc + user stories
     ↓
TL: /dw:arch-review      → architecture decision + approve
     ↓
Dev: /dw:task-init       → task docs
Dev: /dw:research        → codebase analysis
Dev+QC: /dw:plan         → dev plan + test plan (parallel)
     ↓
TL approve plan
     ↓
Dev: /dw:execute         → TDD implementation, commits
     ↓
TL: /dw:review           → architecture + code review
     ↓
QC: manual/auto testing  → Layer 4 verification
     ↓
Dev: /dw:commit          → pre-commit gates
     ↓
PM: /dw:dashboard        → visibility, metrics
```

Không phải mọi task cần full chain. `default_depth` + available roles quyết định.

---

## Role-Depth Matrix

| Role | Quick | Standard | Thorough |
|------|-------|----------|----------|
| dev | required | required | required |
| techlead | not needed | arch decisions only | full review + approval |
| ba | not needed | requirements check | full requirements |
| qc | not needed | not needed | full test plan + sign-off |
| pm | not needed | optional | dashboard |
