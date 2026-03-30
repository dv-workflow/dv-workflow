# Changelog — dw-kit

> **Maintainer**: [huygdv](mailto:huygdv19@gmail.com) · **Repo**: [https://github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)

---

## [v1.1.0] — 2026-03-30

### Added — Retroactive Adoption Skills

- **`/dw-onboard`**: One-time breadth-first codebase scan when adopting dw-kit into an existing running project. Generates `.dw/context/project-map.md` and per-module context docs. Recommends `/dw-retroactive` for complex modules.
- **`/dw-retroactive [name]`**: Depth-first retroactive documentation for a single existing feature/task. Reverse-engineers from code + git history, produces full as-built task docs (context + plan + progress) in `.dw/tasks/[name]/`.

### Added — `--no-dw` Override Flag

- **`--no-dw` in prompt**: Per-request escape hatch. Adding `--no-dw` to any prompt disables all dw workflow instructions (routing, config read, thinking framework) for that request only. Next prompt resumes dw normally. No CLI command or file manipulation needed.

### Changed — Commit Philosophy

- **All `.dw/` content is now committed** — tasks, context, docs, metrics, reports. Teams and open-source contributors share the same context without needing to regenerate it.
- **`dw init` gitignore** now only adds `CLAUDE.local.md` and `.claude/settings.local.json` — no `.dw/` entries.

### Fixed

- **`dw prompt`**: `readAdapter()` was reading `config.adapter` which does not exist in the config schema — always fell back to `'claude-cli'` regardless of actual platform. Now correctly uses `detectPlatform()` to detect Cursor and generic adapters.

### Refactored

- **`dw prompt`**: Removed redundant `readAdapter()` wrapper function; inlined `detectPlatform(process.cwd())` directly at call site.

---

## [v1.0.0] — 2026-03-24

### Architecture: 4-Layer System

**Breaking Changes** (v0.3 legacy migration removed; v1 uses the new config + workflow):

- `dv-workflow.config.yml` → `.dw/config/dw.config.yml` (symlink backward-compat provided)
- `level: 1/2/3` → `workflow.default_depth: quick/standard/thorough`
- 17 feature flags → depth defaults + role-based availability

### Added — npm Package Distribution

- **npm install**: `npm install -g dw-kit` for global CLI, `npx dw-kit init` for zero-install
- `**dw init`**: Node.js interactive wizard — 4 questions, presets, platform auto-detect
- `**dw upgrade**`: Smart update with override-awareness, `--dry-run`, `--check`, `--layer` flags
- `**dw validate**`: Config schema validation using `ajv` — reports unknown keys, invalid values, semantic warnings
- `**dw doctor**`: Installation health check — core files, config, platform detection, version tracking

### Added — Portable Core (`core/`)

- `core/WORKFLOW.md`: 6-phase methodology với section anchors `<!-- @phase:X -->`
- `core/THINKING.md`: thinking framework + First Principles section
- `core/QUALITY.md`: 4-layer quality strategy (Requirements→TDD→Cross-Review→QA Gates)
- `core/ROLES.md`: BA/TL/Dev/QC/PM definitions với decision authority per phase
- `.dw/core/templates/vi/`: guided questionnaire templates (context/plan/progress)

### Added — Upgrade Safety (`.dw/adapters/claude-cli/`)

- `.dw/adapters/claude-cli/generated/`: auto-generated skill shells (DO NOT edit)
- `.dw/adapters/claude-cli/overrides/`: team customizations (NEVER overwritten by upgrade)
- `.dw/adapters/claude-cli/extensions/`: net-new team skills

### Added — Generic Adapter (`adapters/generic/`)

- `adapters/generic/AGENT.md`: methodology reference cho Cursor/Windsurf/Copilot
- Honest về limitations: không replicate agent delegation hay hooks

### Enhanced — Claude Execution Layer

- `agents/researcher.md`: +`mcp__ide__getDiagnostics`, +confidence level per finding
- `agents/planner.md`: +Deep Analysis Protocol (≥3 approaches, devil's advocate)
- `agents/reviewer.md`: +JSON output block cho CI/CD parsing
- `agents/executor.md`: NEW agent với Write/Edit/Bash tools, TDD workflow, worktree support

### Enhanced — Hook System (4 hooks)

- `hooks/safety-guard.sh`: block `rm -rf` nguy hiểm, force push main, SQL không WHERE
- `hooks/post-write.sh`: auto-lint trên file vừa write (non-blocking)
- `hooks/progress-ping.sh`: remind update progress (Notification hook)
- `settings.json`: expanded 2→4 hooks (PreToolUse×2, PostToolUse, Stop, Notification)
- `settings.json`: `mcpServers: {}` slot ready

### Added — Config Layer

- `.dw/config/dw.config.yml`: config với `claude:` section (models, structured_output, worktree_execution, mcp)
- `config/config.schema.json`: JSON Schema validation, strict additionalProperties
- `config/presets/`: solo-quick, small-team, enterprise presets

### Changed

- Bash legacy scripts removed from distribution; CLI commands are the only supported workflow
- README.md updated with npm install instructions as primary setup method

### Technical

- ESM-only package (`"type": "module"`)
- Minimal dependencies: `commander`, `js-yaml`, `chalk`, `ajv`
- Node.js ≥18 required
- CLI locates bundled files via `import.meta.url` — works regardless of npm install location

### Design Decisions

- WORKFLOW.md là on-demand document, KHÔNG always-loaded — ngăn context bloat
- CLAUDE.md redesigned thành tiered loader (~150 lines)
- Agent system enhanced, không simplified — "portable core ≠ thin execution layer"
- Generic adapter honest về limitations thay vì false equivalence

---

## [v0.3.0] — 2026-03-18

### Added

- `rollback` skill — revert task docs về checkpoint (after-research | after-plan | clean)
- `archive` skill — move done tasks vào `.dev-tasks/archive/YYYY-MM/`, maintain index
- `project-templates/enterprise/dv-workflow.config.yml` — Level 3 fully enabled template
- `examples/ci-templates/ci-quality-gate.yml` — GitHub Actions: lint + test + security scan
- `examples/ci-templates/ci-docs-check.yml` — GitHub Actions: weekly living docs freshness

### Enhanced

- `docs-update` SKILL: auto-scaffold `.dev-docs/` on first run, smarter git diff classification table, stale check logic
- `dashboard` SKILL: DORA auto-calculation từ git history, HTML export (`.html` + `.md` dual output), responsive inline CSS template

### Fixed

- `project-templates/new-product`: remove deprecated `paths.templates` key
- `dv-workflow.config.yml`: comment out deprecated `paths.templates`

---

## [v0.2.0] — 2026-03-18

### Changed (Breaking — Integration Architecture)

- `templates/` và `skills/` **đã xóa khỏi root** — nội dung chuyển vào `.claude/`
- Templates: `templates/*.md` → `.claude/templates/*.md`
- THINKING.md: `skills/THINKING.md` → `.claude/skills/thinking/THINKING.md`
- legacy bootstrap no longer copies `templates/` and `skills/` to root; they live under `.claude/`
- `thinking` SKILL: `user-invocable: true` (trước là `false`); `@THINKING.md` (same dir)
- `task-init` SKILL: language-aware template selection (`project.language` trong config)

### Added

- `config-validate` skill — kiểm tra config: unknown keys, invalid values, level 3 beta warning
- `upgrade` skill — provides selective toolkit sync and config backup
- `sprint-review` skill — retrospective, lessons learned, sprint metrics
- `.claude/templates/en/` — English templates (task-context, task-plan, task-progress)
- `docs/custom-skills.md` — hướng dẫn tạo custom skills + examples
- `schemas/effort-log.schema.json` — chuẩn hóa format effort log data

### Updated

- `planner.md`, `research/SKILL.md`: reference THINKING.md path mới
- `CLAUDE.md`: reference THINKING.md path mới

---

## [v0.1.x] — 2026-03-18 (patch)

### Fixed

- **C2**: `pre-commit-gate.sh` — thay `grep+awk` bằng `python3 regex` để parse YAML robust hơn
- **W3**: Demo B — fix code inconsistencies: thêm `UserModel` class-based API, align `displayName` field, thêm BEFORE/AFTER state labels

### Added

- **C1**: Root `README.md` với quick start, level table, links đến docs
- **C3**: `config-init` SKILL — validation step: known keys, level 3 beta warning, flag value check
- **P1**: `docs/cheatsheet.md` — bảng tham chiếu 17 skills 1 trang
- **P2**: Cross-platform notes (Windows Git Bash / WSL) vào `docs/README.md`
- kế hoạch upgrade v0.1.x → v1.0 (historical internal document)

---

## [v0.1] — 2026-03-10 (beta)

Phiên bản đầu tiên. Kiến trúc cốt lõi và bộ skills hoàn chỉnh cho Level 1–2.

### Added

#### Core Workflow

- `config-init` — Bootstrap toolkit cho dự án mới
- `task-init` — Tạo bộ docs (context + plan + progress) cho task
- `research` — Khảo sát codebase (researcher agent, context: fork)
- `plan` — Lập kế hoạch, dừng để approve (planner agent, read-only)
- `execute` — Thực hiện theo plan với TDD
- `commit` — Smart commit với quality checks (debug scan, sensitive data scan)

#### Quality & Debug

- `review` — Code review (reviewer agent, checklist.md)
- `debug` — Debug Investigate → Diagnose → Fix với regression test

#### Tracking & Metrics

- `estimate` — Ước lượng effort với Complexity×Uncertainty matrix
- `log-work` — Ghi nhận effort thực tế, cập nhật progress file
- `dashboard` — Báo cáo PM với DORA metrics

#### Role-Specific Skills

- `requirements` — BA: user stories với Given/When/Then criteria
- `test-plan` — QC: test cases P1-P4, security checklist
- `arch-review` — TL: review kiến trúc, approve plan

#### Collaboration

- `handoff` — Bàn giao session, cập nhật progress file
- `docs-update` — Cập nhật living docs (ARCHITECTURE, API, DATA-MODELS)

#### Agents

- `researcher` — Read-only, Sonnet, git-safe Bash
- `planner` — Read-only, no Bash, subtask granularity rules
- `reviewer` — Sonnet, structured output với severity levels
- `quality-checker` — Haiku, fast checks, JSON output

#### Infrastructure

- `dv-workflow.config.yml` — Config trung tâm với level + flags system
- Level system (1: lite / 2: standard / 3: full)
- Project templates: `new-product` và `old-maintenance`
- Hooks: `pre-commit-gate.sh` (quality gate), Stop hook (session end reminder)
- `.claude/rules/`: commit-standards, code-style, workflow-rules

#### Examples

- `examples/demo-A-bug-fix/` — Bug fix workflow với Express+TS (Level 1)
- `examples/demo-B-new-feature/` — Full-team feature workflow (Level 2)
- `examples/integration-guide/` — v1 setup guide

### Notes

- v0.1 là beta — API có thể thay đổi trong v0.2
- Tested với Claude Code CLI
- Dự kiến open-source sau khi ổn định từ v0.2+

---

## Roadmap

### [v0.2] — Planned

- MCP integration cho external sync (Jira, GitHub, Linear)
- `thinking` skill standalone invocation improvements
- `sprint-review` skill cho team retrospective
- English language support (`language: en`)
- Improved DORA metrics calculation

### [v0.3] — Planned

- Level 3 full workflow với living docs automation
- Dashboard với HTML/markdown report export
- Multi-agent coordination patterns
- Community skill templates (submit via PR)

