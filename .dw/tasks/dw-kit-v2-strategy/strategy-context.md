# Context: dw-kit v2.0 Strategy

## Ngày: 2026-04-20
## Trạng thái: Brainstorming — chờ adversarial review
## Owner: huydv (TechLead)

---

## Background

dw-kit là một "harness layer" cho Claude Code giúp team/solo dev triển khai full flow SDLC.
Hiện tại đang ở **v1.2.1** với các thành phần:

```
Hooks:    scout-block, privacy-block, session-init, pre-commit-gate, safety-guard, post-write, stop-check
Skills:   ~20 slash commands (dw-flow, dw-research, dw-plan, dw-execute, dw-commit, ...)
Config:   dw.config.yml với depth routing, flags, roles
Task docs: 3-file system (context + plan + progress) per task
Rules:    dw-core.md + dw-skills.md + code-style.md injected mỗi session
```

## Pain Points Đã Xác Định (từ TechLead)

1. **Quá nhiều enter/accept** — hooks trigger liên tục trên Read/Glob/Bash
2. **Quá nhiều bước** — skills = full workflow scripts; 3-file mandatory
3. **Token nặng** — rules dài inject mỗi session; verbose templates
4. **Rườm rà** — cảm giác overhead nhiều hơn value

## Target Audience

- **Primary**: 2 internal dev teams (~10 devs), mixed seniority
- **Secondary**: Open source, solo devs vibe coding
- **Constraint**: Dual audience cần cùng core nhưng khác defaults

---

## Câu Hỏi Chiến Lược Cốt Lõi

> **"Khi Claude Code và AI agents đã đủ mạnh, dw-kit có đang gây rào cản hay thực sự amplify?"**

---

## Phân Tích Đã Có (từ session brainstorm)

### Component Value Assessment

| Component | Giá trị hiện tại | Nguy cơ bị AI obsolete |
|-----------|-----------------|------------------------|
| Safety hooks (privacy-block, pre-commit-gate) | **Cao — permanent** | Thấp — safety không obsolete |
| Team config (dw.config.yml) | **Cao** | Thấp — coordination problem luôn tồn tại |
| Context docs (project-map, modules) | **Cao** | Thấp — project memory luôn cần |
| Skills (workflow scripts) | **Trung bình, declining** | Cao — phần dễ bị AI replace nhất |
| Task 3-file docs | **Trung bình** | Trung bình — phụ thuộc AI memory evolution |
| Scout-block hook | **Thấp** | Cao — permission allowlist tĩnh làm tốt hơn |
| Session-init hook | **Trung bình** | Cao — Claude Code memory system đang improve |
| Rules injection (dw-core.md) | **Trung bình** | Trung bình — context overhead thực sự |

### Proposed Strategic Shift

```
Hiện tại (v1.x):  dw-kit = Workflow Engine
Proposed (v2.0):  dw-kit = Memory + Safety Shell
```

**Layer model đề xuất:**
```
┌─────────────────────────────────────┐
│           Claude Code / AI          │  ← AI reasons, dw-kit không script
├─────────────────────────────────────┤
│         CONTEXT LAYER               │  ← project-map, conventions, decisions
├─────────────────────────────────────┤
│         SAFETY LAYER                │  ← privacy-block, pre-commit-gate (non-negotiable)
├─────────────────────────────────────┤
│         TEAM CONFIG                 │  ← roles, depth routing, quality commands
└─────────────────────────────────────┘
```

### 3 Quyết Định Chờ Resolve

**D1: Build strategy**
- Option A: Incremental (v1.3 → v2.0 với deprecation path)
- Option B: Clean-slate redesign một số layers

**D2: Task docs**
- Option A: Giữ 3-file nhưng optional hoàn toàn
- Option B: Replace bằng single `progress.md` only

**D3: Skills direction**
- Option A: Full workflow scripts (hiện tại)
- Option B: "Context injectors" — skills chỉ load context, để AI reason

### Triết Lý "Design for Obsolescence"

Mỗi feature phải pass test:
> *"Nếu Claude Code v3 ra ngày mai, feature này còn có giá trị không?"*

- Safety hooks: YES
- Config/coordination: YES
- Context docs: YES
- Workflow scripts: MAYBE / NO

---

## Dual Audience Config Proposal

```
Preset "team":  depth: standard, full hooks, task docs required ở thorough
Preset "solo":  depth: quick, chỉ safety hooks, zero mandatory docs
```

---

## Open Questions Chưa Resolved

1. Có nên bỏ hoàn toàn scout-block (replace bằng allowlist) không?
2. Session-init inject context — giữ hay deprecate khi Claude memory improve?
3. Skills có nên trở thành "CLAUDE.md snippets" thay vì SKILL.md files không?
4. 3-file task system — overhead hay genuinely useful cho team?
5. Token budget per session hiện tại ước tính bao nhiêu với full rules injection?
6. Với open source users, barrier to entry hiện tại có quá cao không?

---

## Để Tiếp Tục

Đọc thêm:
- `.dw/core/THINKING.md` — framework tư duy
- `.dw/core/WORKFLOW.md` — current workflow design
- `CLAUDE.md` + `.claude/rules/` — rules đang inject
- `.claude/settings.json` — hooks config hiện tại
- `src/commands/` — skills implementation
