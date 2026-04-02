<!-- dw-kit | core: 1.2 | platform: 1.0 -->
# dw-kit

Workflow toolkit cho dev team. Config: `.dw/config/dw.config.yml`
Methodology: `core/WORKFLOW.md` (load on demand — không phải always-loaded)

---

## Override

Nếu prompt của user chứa `--no-dw`:
- Bỏ qua **toàn bộ** dw workflow instructions (Quy Tắc Vàng, Routing, Session Start)
- KHÔNG đọc config, KHÔNG check tasks, KHÔNG apply thinking framework
- Làm việc như Claude thông thường — trả lời trực tiếp, không theo process nào
- Áp dụng cho request đó; request tiếp theo vẫn dùng dw bình thường

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
| `/dw-prompt [desc]` | Build structured prompt (autocomplete + wizard) | all |
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
| `/dw-onboard` | Onboard dw vào existing project (breadth-first scan) | always |
| `/dw-retroactive [name]` | Retroactive doc 1 feature đã có (depth-first) | always |
| `/dw-config-init` | Khởi tạo config mới | always |
| `/dw-config-validate` | Validate config file | always |
| `/dw-upgrade` | Upgrade toolkit | always |
| `/dw-rollback [name]` | Rollback task docs | always |
| `/dw-archive [name]` | Archive completed task | always |
| `/dw-kit-report [desc]` | Gửi feedback/bug về dw-kit tool lên GitHub | always |

> **Maintainer-only** (TechLead, dw-kit repo):
> `/dw-kit-evolve [issue#]` · `/dw-kit-audit [days]`

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

## Hooks (v1.2)

Hooks chạy tự động — không cần user làm gì:

| Hook | Trigger | Tác dụng |
|------|---------|----------|
| `session-init` | Đầu mỗi session | Inject active task context nếu có task In Progress |
| `scout-block` | PreToolUse Read/Glob | Block đọc vào `node_modules/`, `dist/`, `.git/`, etc. |
| `privacy-block` | PreToolUse Read | Block đọc `.env*`, `*.pem`, `credentials*` |
| `pre-commit-gate` | PreToolUse git commit | Quality check + sensitive data scan |
| `safety-guard` | PreToolUse Bash | Block destructive commands |
| `post-write` | PostToolUse Write/Edit | Lint reminder |
| `stop-check` | Stop | Uncommitted changes + in-progress task warning |

## Agent Reports (v1.2)

Khi task có nhiều phases (standard/thorough), tạo reports để track cross-session:

```
.dw/tasks/[task-name]/reports/
└── [YYMMDD-HHMM]-from-[role]-to-[role]-[desc].md
```

Status: `DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`
Template: `.claude/templates/agent-report.md`
Guide: `.dw/core/AGENTS.md`

> Reports là cho **người** đọc (audit trail, team coordination), không phải AI-to-AI messaging.

## Config Local Override (v1.2)

Tạo `.dw/config/dw.config.local.yml` (gitignored) để override settings machine-specific:

```yaml
# dw.config.local.yml — không commit file này
claude:
  models:
    plan: "claude-opus-4-6"
quality:
  test_command: "npm test"
```

---

## Methodology Reference

Full methodology: `core/WORKFLOW.md`
Thinking framework: `core/THINKING.md`
Quality strategy: `core/QUALITY.md`
Role definitions: `core/ROLES.md`
Agent protocol: `.dw/core/AGENTS.md`
