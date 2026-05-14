# dw-kit

> An AI development workflow toolkit for teams using agentic IDEs (Claude Code, Cursor) — from idea to review-ready commits.

**v1.3.6** · `npm install -g dw-kit` · [Docs](docs/README.md) · [Get started](docs/get-started.md) · [Cheatsheet](docs/cheatsheet.md) · [Migration v1.3](MIGRATION-v1.3.md) · [Changelog](CHANGELOG.md)

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

- **v1.3.6** (2026-05-14) — Supply-Chain Guard upgraded to 3-pillar architecture: OSV snapshot + curated IoC fixture (version-aware, wired into default scan) + **AI-Native NEW-package heuristic** that catches zero-day-ish risk at the AI-edit boundary. See [`CHANGELOG.md#v136--2026-05-14`](CHANGELOG.md#v136--2026-05-14) and [ADR-0006](.dw/decisions/0006-supply-chain-guard-heuristic.md).
- v1.3.5 (2026-05-12) — AI-Native Supply-Chain Guard: `dw security-scan` CLI + OSV.dev auto-sync + Edit-lockfile hook + scoped `.gitignore` for end-user projects. See [ADR-0005](.dw/decisions/0005-supply-chain-guard.md). Public 90-day sunset review committed for 2026-08-12.
- v1.3.4 (2026-04-21) — `/dw:plan` Quick Debate (red/blue self-critique), depth-driven activation
- v1.3.3 (2026-04-21) — Writer skills v1/v2 compatibility fix
- v1.3.0 (2026-04-21) — 5-pillar governance layer + telemetry foundation + ADRs + v2 task docs ([ADR-0001](.dw/decisions/0001-v2-pragmatic-lean.md))
- v1.2.0 (2026-04-09) — [`CHANGELOG.md#v120--2026-04-09`](CHANGELOG.md#v120--2026-04-09)
- Full changelog: `CHANGELOG.md`
- Latest release notes: [GitHub Releases](https://github.com/dv-workflow/dv-workflow/releases)

### What's in v1.3.6 for your team

Reaction time when a supply-chain incident drops goes from 24-72 hours (wait for OSV index + npm publish cycle) to **~1 hour** (AI edits lockfile → hook fires → heuristic flags BEFORE anyone knows).

- **3-pillar default scan** — `dw security-scan` now runs OSV snapshot + curated IoC fixture + AI-Native heuristic in one go. Heuristic only probes NEW/bumped packages from `git show HEAD:package-lock.json` diff — typical edit = 1-5 packages probed, not 1000+.
- **npm registry metadata heuristic** — composite scoring on `recent_publish` (<72h), `popular_package` (≥10k weekly DL), `maintainer_change_recent`, `major_version_jump`, `typo_squat`. Per-package metadata cached 1h. Tunable threshold via `.dw/config/dw.config.yml`.
- **Version-aware IoC fixture** — `affected_range` per entry. Concrete versions out-of-range are skipped (no false positives). Range specs (`^1.169.0`) emit ambiguity warnings with severity downgrade.
- **Hook fires `dw security-scan --heuristic-only`** on Claude Code lockfile edit — fast diff-only check.
- **Telemetry per pillar** — `source: 'osv' | 'fixture' | 'heuristic'` tracked separately so the 2026-08-12 sunset review attributes catches to the right pillar.
- **`>1000 packages`** crash bug from v1.3.5 fixed (chunked OSV batches).

### What's in v1.3.5 for your team

- **`dw security-scan`** — scan for known supply-chain advisories against your project's `package-lock.json` (full match) or `package.json` (pre-install approximate). Uses [OSV.dev](https://osv.dev/) as data source (multi-maintainer upstream feed; no solo-curated bundle to go stale).
- **AI-aware hook** — fires when Claude Code edits a lockfile. Auto-wired by `dw init --preset team` or `--preset enterprise`; opt-in OFF for `--preset solo`.
- **Scoped `.gitignore`** — `dw init` and `dw upgrade` write `.dw/.gitignore` and `.claude/.gitignore` managed blocks. Framework files stay out of your repo; tasks/decisions/docs/config stay in.
- **`dw doctor`** has a new security section that fails loud if advisory snapshot is stale (>7 days) or schema-incompatible.
- **Sunset rule** — feature retires silently in v1.4.x if 90-day telemetry shows zero real catches OR >5% false-positive rate. Disciplined experiment, not panic ship.

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
