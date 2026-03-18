# Changelog — dv-workflow-kit

> **Maintainer**: [huygdv](mailto:huygdv19@gmail.com) · **Repo**: https://github.com/dv-workflow/dv-workflow

---

## [v0.2.0] — 2026-03-18

### Changed (Breaking — Integration Architecture)
- `templates/` và `skills/` **đã xóa khỏi root** — nội dung chuyển vào `.claude/`
- Templates: `templates/*.md` → `.claude/templates/*.md`
- THINKING.md: `skills/THINKING.md` → `.claude/skills/thinking/THINKING.md`
- `setup.sh`: không còn copy `templates/` và `skills/` ra root; copy `.claude/templates/` thay thế
- `thinking` SKILL: `user-invocable: true` (trước là `false`); `@THINKING.md` (same dir)
- `task-init` SKILL: language-aware template selection (`project.language` trong config)

### Added
- `config-validate` skill — kiểm tra config: unknown keys, invalid values, level 3 beta warning
- `upgrade` skill — update submodule + selective file sync + config backup
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
- `docs/upgrade-plan.md` — kế hoạch upgrade v0.1.x → v1.0

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
- `examples/integration-guide/` — Git submodule setup guide

### Notes

- v0.1 là beta — API có thể thay đổi trong v0.2
- Tested với Claude Code CLI
- Dự kiến open-source sau khi ổn định từ v0.2+

---

## Roadmap

### [v0.2] — Planned
- [ ] MCP integration cho external sync (Jira, GitHub, Linear)
- [ ] `thinking` skill standalone invocation improvements
- [ ] `sprint-review` skill cho team retrospective
- [ ] English language support (`language: en`)
- [ ] Improved DORA metrics calculation

### [v0.3] — Planned
- [ ] Level 3 full workflow với living docs automation
- [ ] Dashboard với HTML/markdown report export
- [ ] Multi-agent coordination patterns
- [ ] Community skill templates (submit via PR)
