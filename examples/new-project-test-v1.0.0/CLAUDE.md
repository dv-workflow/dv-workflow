<!-- dw-kit | core: 1.0 | platform: 1.0 -->
# dw-kit

Workflow toolkit cho dev team. Config: `.dw/config/dw.config.yml`
Methodology: `core/WORKFLOW.md` (load on demand — không phải always-loaded)

---

## Quy Tắc Vàng

1. **Config-driven**: Đọc `.dw/config/dw.config.yml` trước mọi action
2. **Research trước, code sau**: Task ≥3 files BẮT BUỘC qua research → plan → execute
3. **Thinking framework**: Áp dụng `core/THINKING.md` khi planning
4. **TDD**: Viết test trước khi code
5. **Commit nhỏ**: Mỗi subtask = 1 commit

---

## Routing

Đọc `workflow.default_depth` từ config. AI assess per-task:

| Scope | Depth | Workflow |
|-------|-------|---------|
| ≤2 files, hotfix, familiar module | quick | Understand → Execute → Close |
| 3-5 files, module mới | standard | Tất cả 6 phases |
| 6+ files, API/DB/security changes | thorough | Full + arch-review + test-plan |

Không chắc scope → dùng `standard`. Assess dựa trên facts (file count, API changes, git blame).

---

## Session Start

1. Đọc `.dw/config/dw.config.yml` → depth, roles, quality commands
2. Kiểm tra `.dw/tasks/` → active tasks
3. Đọc `[task]-progress.md` của task đang dở → tiếp tục từ subtask cuối

---

## Skills

| Skill | Mô tả | Depth |
|-------|--------|-------|
| `/dw-task-init [name]` | Khởi tạo task docs | all |
| `/dw-research [name]` | Khảo sát codebase | all |
| `/dw-plan [name]` | Lập kế hoạch (DỪNG chờ approve) | standard+ |
| `/dw-execute [name]` | Implement theo plan (TDD) | all |
| `/dw-commit [msg]` | Smart commit + quality gates | all |
| `/dw-review` | Code review với checklist | standard+ |
| `/dw-debug [issue]` | Debug: investigate → diagnose → fix | all |
| `/dw-thinking [question]` | Apply thinking framework | all |
| `/dw-estimate [name]` | Ước lượng effort | if enabled |
| `/dw-log-work [name]` | Ghi effort thực tế | if enabled |
| `/dw-handoff` | Bàn giao session | all |
| `/dw-requirements` | BA: requirements + user stories | if ba role |
| `/dw-test-plan` | QC: test plan + regression | if qc role |
| `/dw-arch-review` | TL: architecture review | if techlead |
| `/dw-dashboard` | PM: metrics report | if pm role |
| `/dw-sprint-review` | Team retrospective | all |
| `/dw-docs-update` | Cập nhật living docs | thorough |
| `/dw-config-init` | Khởi tạo config mới | always |
| `/dw-config-validate` | Validate config file | always |
| `/dw-upgrade` | Upgrade toolkit | always |
| `/dw-rollback [name]` | Rollback task docs | always |
| `/dw-archive [name]` | Archive completed task | always |

---

## Task Documentation

```
.dw/tasks/[task-name]/
├── [name]-context.md    # Research findings
├── [name]-plan.md       # Implementation plan
└── [name]-progress.md   # Progress + handoff notes
```

---

## Commit Format

```
<type>(<scope>): <mô tả ≤72 ký tự>

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat` `fix` `refactor` `test` `docs` `chore` `style` `perf`

---

## Methodology Reference

Full methodology: `core/WORKFLOW.md`
Thinking framework: `core/THINKING.md`
Quality strategy: `core/QUALITY.md`
Role definitions: `core/ROLES.md`

---

## Tech Stack

<!-- Update with your project's actual stack -->
- Framework: [e.g. NestJS / Django / Laravel / Next.js]
- Database: [e.g. PostgreSQL / MySQL / MongoDB]
- Testing: [e.g. Jest / Pytest / PHPUnit]

## Project-Specific Rules

<!-- Add project-specific rules -->
- [Rule 1]
