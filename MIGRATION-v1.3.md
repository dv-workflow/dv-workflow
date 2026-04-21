# Migration Guide — dw-kit v1.2.x → v1.3

**Target version:** 1.3.0
**Ship date:** 2026-05-12 (target)
**Status:** In Progress

This guide documents all user-visible changes in v1.3. v1.3 is **fully backward compatible** with v1.2.x — existing projects continue to work. New features are opt-in.

---

## At a Glance

| Area | Change | Impact |
|------|--------|--------|
| Task docs | New 2-file format (`spec.md` + `tracking.md`) available; 3-file legacy still works | Opt-in |
| Decisions layer | New `.dw/decisions/` directory for ADRs | New feature |
| ACTIVE index | `.dw/tasks/ACTIVE.md` auto-generated | New feature |
| Telemetry | Local-only metrics in `.dw/metrics/events.jsonl` | Opt-out via `DW_NO_TELEMETRY=1` |
| Solo preset | `dw init --preset solo` available | New option |
| Skill naming | `/dw-*` may be renamed to `/dw:*` (pending harness verification) | **Potentially breaking** |
| Archive | 8 Done tasks moved to `.dw/tasks/archive/` in dw-kit repo itself | No user impact |

---

## New Features (Opt-In)

### 1. Task Docs v2 Format

**Before (v1.x):** 3 files per task
```
.dw/tasks/{name}/
├── {name}-context.md
├── {name}-plan.md
└── {name}-progress.md
```

**Now (v1.3):** Simpler 2-file default
```
.dw/tasks/{name}/
├── spec.md       # Intent + plan merged
└── tracking.md   # Progress + handoff
```

Templates at `.dw/core/templates/v2/spec.md` and `.dw/core/templates/v2/tracking.md`.

**Migration:** Existing 3-file tasks continue to work. For new tasks, copy from new templates.

### 2. Decisions Layer (ADRs)

New `.dw/decisions/` directory for Architecture Decision Records.

- Template: `.dw/decisions/_template.md`
- Format: YAML frontmatter + TL;DR + Context + Options + Decision + Consequences
- Example: `.dw/decisions/0001-v2-pragmatic-lean.md` (dw-kit's own v2 direction)

**Why:** Capture *why* decisions were made, not just *what*. Complements code and git history.

### 3. ACTIVE.md Auto-Index

`.dw/tasks/ACTIVE.md` auto-generated with 1 line per active task. Format:
```
- `{task-name}` · {status} · {last-updated} · {blockers}
```

Excludes `.dw/tasks/archive/`. TechLead can `cat .dw/tasks/ACTIVE.md` to see team state at a glance.

**New CLI:** `dw active` to regenerate.

### 4. Local Telemetry

**Privacy-first design:**
- **Local-only by default.** Zero network calls.
- Schema: append-only JSONL at `.dw/metrics/events.jsonl`
- Events logged: skill invocations, hook fires, task lifecycle
- Inspect: `dw metrics show`
- Opt-out: `DW_NO_TELEMETRY=1` environment variable

**What's collected:** timestamps, event type, skill/hook name, session hash, depth, latency. **Not collected:** file contents, prompts, personal data.

**Internal team policy (for 2 internal teams only):** Mandatory for v1.4 cut decisions. Can still set `DW_NO_TELEMETRY=1` on specific machine.

### 5. Solo Preset

**New:** `dw init --preset solo` — optimized for solo developers / vibe coders.

**Enabled by default:** `privacy-block`, `pre-commit-gate` hooks only (safety-critical).
**Disabled:** Task docs, session-init, scout-block, post-write, progress-ping, telemetry.

Target: working setup in <30 seconds, zero friction.

---

## Potentially Breaking (Pending Verification)

### Skill Naming: `/dw-{name}` → `/dw:{name}`

**Status:** Pending Claude Code harness verification.

**Rationale:** Colon creates clear namespace separator, matches industry conventions (`git:log`, `npm:run`).

**Change:** SKILL.md frontmatter `name:` field. Directory names unchanged (`:` illegal on Windows filesystems).

**Before:** `name: dw-thinking` → invoke `/dw-thinking`
**After:** `name: dw:thinking` → invoke `/dw:thinking`

**Mapping table (if applied):**

| v1.x | v1.3+ |
|------|-------|
| `/dw-flow` | `/dw:flow` |
| `/dw-task-init` | `/dw:task-init` |
| `/dw-research` | `/dw:research` |
| `/dw-plan` | `/dw:plan` |
| `/dw-execute` | `/dw:execute` |
| `/dw-commit` | `/dw:commit` |
| `/dw-handoff` | `/dw:handoff` |
| `/dw-debug` | `/dw:debug` |
| `/dw-review` | `/dw:review` |
| `/dw-thinking` | `/dw:thinking` |
| `/dw-prompt` | `/dw:prompt` |
| `/dw-docs-update` | `/dw:docs-update` |
| `/dw-requirements` | `/dw:requirements` |
| `/dw-test-plan` | `/dw:test-plan` |
| `/dw-arch-review` | `/dw:arch-review` |
| `/dw-dashboard` | `/dw:dashboard` |
| `/dw-sprint-review` | `/dw:sprint-review` |
| `/dw-estimate` | `/dw:estimate` |
| `/dw-log-work` | `/dw:log-work` |
| `/dw-onboard` | `/dw:onboard` |
| `/dw-retroactive` | `/dw:retroactive` |
| `/dw-config-init` | `/dw:config-init` |
| `/dw-config-validate` | `/dw:config-validate` |
| `/dw-upgrade` | `/dw:upgrade` |
| `/dw-rollback` | `/dw:rollback` |
| `/dw-archive` | `/dw:archive` |
| `/dw-kit-report` | `/dw:kit-report` |
| `/dw-kit-evolve` | `/dw:kit-evolve` |
| `/dw-kit-audit` | `/dw:kit-audit` |

See `ADR-0002` for full rationale.

---

## Deprecations (No Removal in v1.3)

These are marked for removal in v1.4+ based on telemetry evidence:

| Feature | Replacement | Removal Target |
|---------|-------------|----------------|
| `scout-block.sh` hook | Permission allowlist in settings.json | v1.4 |
| `post-write.sh` hook | None (low-value reminder) | v1.4 |
| `progress-ping.sh` hook | `tracking.md` manual + Stop hook | v1.4 |
| `session-init.sh` hook inject context | `.dw/tasks/ACTIVE.md` auto-loaded | v1.4 |
| Split rules files (5 files) | Consolidated 1-2 files | v1.4 |
| 3-file task docs mandatory | 2-file default (legacy still works) | v2.0 |
| Prescriptive `/dw-research`, `/dw-plan`, `/dw-execute` | Context injector pattern | v2.0 |

**Escape hatch:** Set `legacy_features: true` in `.dw/config/dw.config.yml` to keep v1.x behavior through v2.0.

---

## Upgrade Steps

### Automated
```bash
npx dw-kit upgrade
```

This will:
1. Merge new templates into `.dw/core/templates/v2/`
2. Create `.dw/decisions/` if missing
3. Generate initial `.dw/tasks/ACTIVE.md`
4. Add telemetry module (local-only)
5. NOT touch existing task docs or skills

### Manual Checks After Upgrade

- [ ] Verify `.dw/tasks/ACTIVE.md` generated correctly
- [ ] Read new `ADR-0001` to understand v2.0 direction
- [ ] Optional: set `DW_NO_TELEMETRY=1` if you want to opt out
- [ ] Optional: try `dw init --preset solo` for new projects

### Rollback
```bash
npm install -g dw-kit@1.2.1
```
Your existing `.dw/` data remains compatible with v1.2.1.

---

## Known Issues

- Skill naming (`/dw:*`) pending Claude Code harness verification. If harness rejects `:` in skill `name:` field, rename will be reverted in v1.3.1.

---

## Feedback

- Internal teams: Slack channel `#dw-kit`
- Open source: https://github.com/dv-workflow/dv-workflow/issues
- Use `/dw-kit-report` (or `/dw:kit-report` after rename) to file structured feedback.
