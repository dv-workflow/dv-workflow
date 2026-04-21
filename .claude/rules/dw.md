# dw Workflow (consolidated)

Config: `.dw/config/dw.config.yml`
Full methodology: `.dw/core/` (WORKFLOW · THINKING · QUALITY · ROLES · PILLARS)

---

## Override

Prompt contains `--no-dw` → ignore all dw instructions for that request, work as plain Claude Code.

---

## 5-Pillar Architecture (v2.0)

| Pillar | Role | Owners | Examples |
|--------|------|--------|----------|
| **Guards** | Block unsafe actions | privacy-block, pre-commit-gate | Non-negotiable safety |
| **Surfaces** | Make state visible | ACTIVE.md, project-map, modules | Shared team context |
| **Records** | Capture decisions | ADRs in `.dw/decisions/` | Organizational memory |
| **Bridges** | Connect across sessions | auto-handoff, tracking.md | Continuity over time |
| **Tunes** | Behavioral knobs | roles, depth, presets | Team/solo customization |

---

## Depth Routing

Assess per task — file count, API changes, git blame:

| Scope | Depth | Approach |
|-------|-------|----------|
| ≤2 files, hotfix | quick | Understand → Execute → Close |
| 3–5 files, new module | standard | spec.md + tracking.md |
| 6+ files, API/DB/security | thorough | Full 2-file + optional reports/ |

Default when unsure: `standard`.

---

## Session Start

1. Read `.dw/tasks/ACTIVE.md` — single source of truth for team state
2. Resume any task with status `In Progress` from its `tracking.md`
3. Check `.dw/decisions/` for recent ADRs if task touches architecture

---

## Task Docs (v2 default — 2 files)

```
.dw/tasks/{task-name}/
├── spec.md      # Intent + plan (stable after approve)
└── tracking.md  # Progress + handoff (mutable)
```

Legacy 3-file (`context + plan + progress`) still supported for older tasks.

Templates at `.dw/core/templates/v2/`.

---

## Skills — Namespace `/dw:*`

All dw skills invoke via `/dw:{name}` (colon namespace separator).

Core workflow: `/dw:flow` · `/dw:task-init` · `/dw:research` · `/dw:plan` · `/dw:execute` · `/dw:commit` · `/dw:handoff`

Decisions: `/dw:decision [title]` — create ADR

Dev: `/dw:debug` · `/dw:review` · `/dw:thinking` · `/dw:prompt` · `/dw:docs-update`

Role-specific: `/dw:requirements` · `/dw:test-plan` · `/dw:arch-review` · `/dw:dashboard` · `/dw:sprint-review`

Setup: `/dw:onboard` · `/dw:retroactive` · `/dw:config-init` · `/dw:upgrade` · `/dw:rollback` · `/dw:archive`

See `.dw/core/skills-index.md` for complete list with descriptions.

---

## Commit Format

```
<type>(<scope>): <description ≤72 chars>
```

Types: `feat` `fix` `refactor` `test` `docs` `chore` `style` `perf`

---

## Hooks

| Hook | Purpose |
|------|---------|
| `privacy-block` | Guard — block .env/credentials/keys |
| `pre-commit-gate` | Guard — quality check + sensitive scan |
| `stop-check` | Bridge — auto-handoff to tracking.md + uncommitted warning |
| `telemetry-log` | Meta — local event log for v1.4 cut decisions |

Legacy (deprecated, removal in v2.0 based on telemetry): scout-block, post-write, progress-ping, session-init, safety-guard.

---

## Decisions Layer

ADRs at `.dw/decisions/{NNNN}-{title}.md`. Create with `/dw:decision`.

Status values: `Proposed | Accepted | Deprecated | Superseded by ADR-{NNNN}`

When to write: architectural choice · cross-cutting concern · breaking change · trade-off with long-term impact.

---

## Telemetry (Local-Only)

- Storage: `.dw/metrics/events.jsonl`
- Inspect: `dw metrics show`
- Privacy: zero network; `DW_NO_TELEMETRY=1` to disable
- Used for: v1.4 data-driven cut decisions (internal teams only)

---

## Config Local Override

`.dw/config/dw.config.local.yml` (gitignored) for machine-specific overrides.

---

## Presets

| Preset | Audience | Config |
|--------|----------|--------|
| `solo` | Vibe coders, solo dev | Guards only, zero task docs |
| `team` | 5-15 dev teams | Full hooks, tracking encouraged |
| `enterprise` | Regulated / large teams | Full + roles + audit |

Install: `dw init --preset {name}` or `dw init --solo`.
