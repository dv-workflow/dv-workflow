<!-- dw-kit | core: 1.2 -->
# dw Workflow

Config: `.dw/config/dw.config.yml`
Full methodology: `.dw/core/WORKFLOW.md` · `.dw/core/THINKING.md` · `.dw/core/QUALITY.md` · `.dw/core/ROLES.md`

---

## Override

If the prompt contains `--no-dw`: ignore all dw instructions, work as plain Claude Code. Applies only to that request.

---

## Depth Routing

Read `workflow.default_depth` from config. Assess per task based on facts (file count, API changes, git blame) — not assumptions:

| Scope | Depth | Approach |
|-------|-------|----------|
| ≤2 files, hotfix, familiar module | quick | Understand → Execute → Close |
| 3–5 files, new module | standard | Full 6-phase |
| 6+ files, API/DB/security changes | thorough | Full + arch-review + test-plan |

When unsure → default to `standard`.

---

## Session Start

1. Read `.dw/config/dw.config.yml` — depth, roles, quality commands
2. Check `.dw/tasks/` for active tasks; if one is in progress, resume from its `[task]-progress.md`

> `session-init` hook auto-injects active task context — no manual action needed.

---

## Task Docs

For tasks spanning 3+ files, research → plan → approve → execute gives better outcomes.

```
.dw/tasks/[task-name]/
├── [name]-context.md    # Research findings
├── [name]-plan.md       # Implementation plan
└── [name]-progress.md   # Progress + handoff notes
```

---

## Commit Format

```
<type>(<scope>): <description ≤72 chars>
```

Types: `feat` `fix` `refactor` `test` `docs` `chore` `style` `perf`

---

## Hooks (v1.2)

Auto-run — no user action needed:

| Hook | Trigger | Effect |
|------|---------|--------|
| `session-init` | Session start | Inject active task context |
| `scout-block` | Read/Glob | Block node_modules/, dist/, .git/ etc. |
| `privacy-block` | Read | Block .env*, *.pem, credentials* |
| `pre-commit-gate` | Bash (git commit) | Quality check + sensitive data scan |
| `safety-guard` | Bash | Block destructive commands |
| `post-write` | Write/Edit | Lint reminder |
| `stop-check` | Stop | Warn on uncommitted changes + in-progress tasks |

---

## Agent Reports (v1.2)

For multi-phase tasks (standard/thorough), create reports for audit trail:

```
.dw/tasks/[task-name]/reports/[YYMMDD-HHMM]-from-[role]-to-[role]-[desc].md
```

Status: `DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`
Template: `.claude/templates/agent-report.md` · Guide: `.dw/core/AGENTS.md`

---

## Config Local Override (v1.2)

`.dw/config/dw.config.local.yml` (gitignored) for machine-specific settings:

```yaml
claude:
  models:
    plan: "claude-opus-4-6"
quality:
  test_command: "npm test"
```
