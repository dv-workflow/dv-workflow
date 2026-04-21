# dw-kit

> An AI development workflow toolkit for teams using agentic IDEs (Claude Code, Cursor) — from idea to review-ready commits.

**v1.3** · `npm install -g dw-kit` · [Docs](docs/README.md) · [Get started](docs/get-started.md) · [Cheatsheet](docs/cheatsheet.md) · [Migration v1.3](MIGRATION-v1.3.md) · [Changelog](CHANGELOG.md)

---

## What is dw-kit?

dw-kit helps your team run AI-assisted development with a **repeatable workflow** and clear checkpoints:

```
Initialize → Understand → Plan → Execute (TDD) → Verify → Close
```

<img src="docs/workflow-diagram.svg" alt="dw-kit workflow diagram" />

## Workflow overview

`dw` runs a 6-phase process (all phases for `standard` and `thorough`):

Initialize → Understand → Plan (stops for approval) → Execute (TDD; 1 commit per subtask) → Verify (quality gates + review sign-off) → Close (handoff + archive when done).

### 6 phases (full workflow)
- **Initialize**: clarify task scope and set up the workspace + task docs.
- **Understand**: survey the codebase, dependencies, patterns, and test coverage (no implementation).
- **Plan**: design the solution and subtasks; **pause for your approval**.
- **Execute**: implement using **TDD**; each subtask produces a commit.
- **Verify**: run quality gates + review sign-off to ensure correctness and safety.
- **Close**: handoff notes, finalize progress, and archive when done.

It’s designed for collaboration (Dev / Tech Lead / QA / PM) and keeps work auditable via lightweight task docs.

---

## Release notes

- v1.2.0 notes: [`CHANGELOG.md#v120--2026-04-09`](CHANGELOG.md#v120--2026-04-09)
- Full changelog: `CHANGELOG.md`
- Latest release notes: [GitHub Releases](https://github.com/dv-workflow/dv-workflow/releases)

---

## Install

```bash
npm install -g dw-kit
```

---

## Quick start

Setup dw in project directory:

```bash
dw init
```

Then in **Claude Code CLI**, run the full workflow:

```
/dw:flow your-task-or-anythings
```

---

Discover other skills:

```
/dw:prompt
/dw:thinking
/dw:decision
...
```

> **v1.3 note**: Slash commands switched from `/dw-*` to `/dw:*` (namespace convention). See [MIGRATION-v1.3.md](MIGRATION-v1.3.md).

---

## CLI commands

```bash
dw init                 # setup wizard / presets
dw init --solo          # zero-config solo dev setup (v1.3)
dw validate             # validate .dw/config/dw.config.yml
dw doctor               # installation health check
dw upgrade              # update toolkit files (override-aware)
dw upgrade --check      # check for updates only
dw upgrade --dry-run    # preview changes
dw prompt               # build a well-structured task prompt (autocomplete + wizard)
dw prompt --text "..."  # non-interactive: structure a description directly
dw active               # regenerate .dw/tasks/ACTIVE.md index (v1.3)
dw metrics              # inspect local telemetry (v1.3, opt-out via DW_NO_TELEMETRY=1)
dw dashboard            # active tasks + ADRs + telemetry summary (v1.3)
dw claude-vn-fix        # patch Claude CLI to fix Vietnamese IME (backup/restore)
```

`dw claude-vn-fix` patches the local Claude CLI bundle to fix Vietnamese IME input (DEL char `\x7f` issue). Includes auto-backup and rollback.

---

## Depth system

Pick a default depth for your project, then override per task when risk increases.

| Depth | Best for | Workflow |
|-------|----------|----------|
| `quick` | Solo dev, hotfix, familiar code | Understand → Execute → Close |
| `standard` | Small teams, new features | Full 6 phases |
| `thorough` | Risky changes (API/DB/security) | Full workflow + arch-review + test-plan |

Configured in `.dw/config/dw.config.yml`:

```yaml
workflow:
  default_depth: "standard"
```

---

## What gets added to your repo?

```
.dw/
  core/       methodology + PILLARS.md
  config/     dw.config.yml (+ optional .local.yml)
  decisions/  ADRs (v1.3) — architectural decision records
  tasks/      task docs + ACTIVE.md index (v1.3)
  metrics/    local telemetry (v1.3, opt-out)
.claude/    # Claude Code: skills, hooks, agents, rules
CLAUDE.md   # project context for the agent
```

---

## 5-pillar architecture (v1.3+)

dw-kit is a **context-first governance layer** on top of your AI agent — not a prescriptive workflow engine. Five pillars, verb-based:

| Pillar | Purpose | Examples |
|--------|---------|----------|
| **Guards** | Safety before action | `safety-guard`, `privacy-block`, `pre-commit-gate` |
| **Surfaces** | Make state visible | `ACTIVE.md`, `dw dashboard`, `project-map.md` |
| **Records** | Preserve memory | ADRs in `.dw/decisions/`, task docs |
| **Bridges** | Continuity across sessions/roles | `session-init`, auto-handoff in `tracking.md` |
| **Tunes** | Adapt to team shape | presets (`solo`, `team`, `enterprise`), config flags |

Full spec: [`.dw/core/PILLARS.md`](.dw/core/PILLARS.md)

**Design principle — obsolescence test**: Every feature must answer "will this be *more* valuable when AI is smarter?" If no → cut or defer.

---

Maintainer: [huygdv](mailto:huygdv19@gmail.com)
