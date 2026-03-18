# dv-workflow-kit — Upgrade Plan

> **Dựa trên**: `toolkit-evaluation-report-20260318.md` + CHANGELOG roadmap hiện tại
> **Ngày tạo**: 2026-03-18
> **Phiên bản hiện tại**: v0.1 (beta)

---

## Tổng Quan Phiên Bản

```
v0.1   (hiện tại) — Core workflow hoàn chỉnh, Level 1-2
v0.1.x (patch)    — Sửa lỗi nghiêm trọng, polish cơ bản
v0.2.0            — Strengthen: DX, validation, self-tests, English
v0.3.0            — Level 3 completion + CI/CD integration
v0.4.0            — Ecosystem: MCP, community
v1.0.0            — Production-ready: trial project-team (open-source target)
```

---

## v0.1.x — Patch: Polish Trước Open-Source

> **Mục tiêu**: Fix critical issues, sẵn sàng cho người dùng mới clone lần đầu.
> **Scope**: Không thêm feature mới. Chỉ fix và polish.

### Critical Fixes

| # | Issue | Action | File(s) |
|---|-------|--------|---------|
| C1 | Thiếu root `README.md` | Tạo root README với hero, quick start, badges, link đến `docs/README.md` | `/README.md` (new) |
| C2 | YAML parsing fragile trong hook | Thay `grep + awk` bằng `python3 -c "import yaml"` hoặc `yq` | `.claude/hooks/pre-commit-gate.sh` |
| C3 | Config typo im lặng | Thêm validation step vào `config-init` SKILL: kiểm tra known keys, warn nếu unknown | `.claude/skills/config-init/SKILL.md` |

### Warning Fixes

| # | Issue | Action | File(s) |
|---|-------|--------|---------|
| W3 | Demo B code inconsistencies | Tách rõ "before" vs "after" state, hoặc thêm comment giải thích intent | `examples/demo-B-new-feature/` |

### Polish

| # | Action | Output |
|---|--------|--------|
| P1 | Tạo 1-page cheatsheet: all skills + khi nào dùng | `docs/cheatsheet.md` |
| P2 | Thêm cross-platform notes (Windows Git Bash vs WSL vs macOS) | `docs/README.md` (update section) |
| P3 | Thêm warning trong config khi `level: 3` — một số features là beta | `dv-workflow.config.yml` (comment) + `config-init` SKILL |

### Deliverables

- [ ] `/README.md` — root file với quick start
- [ ] `pre-commit-gate.sh` — robust YAML parsing
- [ ] `docs/cheatsheet.md` — 1-page reference
- [ ] `config-init` SKILL — validation bước đầu

---

## v0.2.0 — Strengthen: Developer Experience

> **Mục tiêu**: Toolkit tự tin hơn — có validation, có update path, có tests cho chính nó, English support.
> **Target**: Solo dev và small team (2-5 người) dùng production.

### Theme 0: Integration Architecture — Single Directory Boundary

> **Vấn đề**: `setup.sh` hiện tại copy `templates/` và `skills/THINKING.md` ra project root, tạo folder thừa ngoài `.claude/`.
>
> **Nguyên tắc mới**: Mọi thứ của dw trong project phải nằm trong `.claude/` — single directory boundary, ngoài ra chỉ có `dv-workflow.config.yml`, `CLAUDE.md`, và runtime dirs (`.dev-tasks/`, `.dev-docs/`).

**Cấu trúc sau khi fix:**
```
project-root/
├── .dv-workflow/           ← submodule (read-only)
├── .claude/                ← TẤT CẢ dw content nằm đây
│   ├── skills/
│   ├── agents/
│   ├── rules/
│   ├── hooks/
│   ├── templates/          ← CHUYỂN từ templates/ vào đây
│   └── settings.json
├── .dev-tasks/             ← runtime (project artifact)
├── .dev-docs/              ← runtime (project artifact)
├── dv-workflow.config.yml
└── CLAUDE.md
```

**THINKING.md**: move từ `skills/THINKING.md` → `.claude/skills/thinking/THINKING.md` (đã có SKILL.md ở đó).

**Actions:**
- Update tất cả SKILL.md references: `templates/...` → `.claude/templates/...`
- Update references tới `skills/THINKING.md` → `.claude/skills/thinking/THINKING.md`
- Update `setup.sh`: bỏ bước copy `templates/` và `skills/` ra root, copy vào `.claude/templates/` thay thế
- Update `docs/integration-guide/README.md`: diagram cấu trúc mới
- **Files**: `setup.sh`, tất cả SKILL.md reference templates, planner agent, plan skill

### Theme 1: Robustness

#### Config JSON Schema + Validator (`config-validate`)
- Tạo `config.schema.json` định nghĩa tất cả valid keys, types, enum values
- Tạo skill `/dw-config-validate` chạy validation và report lỗi
- `config-init` gọi validator sau khi tạo config
- **Files**: `config.schema.json` (new), `.claude/skills/config-validate/SKILL.md` (new)

#### Self-Tests Cho Toolkit
- Tạo `tests/` directory với smoke tests:
  - Template files không có syntax error
  - Config schema valid
  - Hook scripts chạy trên bash
  - Skill YAML frontmatter đúng format
- **Files**: `tests/smoke-test.sh` (new), `tests/validate-templates.py` (new)

### Theme 2: Update Mechanism

#### `/dw-upgrade` Skill
- Compare version hiện tại với version mới (từ git tag hoặc CHANGELOG)
- List files đã thay đổi trong toolkit
- Selective update: chỉ update toolkit files, preserve user customizations
- Backup config trước khi update
- **Logic**:
  ```
  1. git fetch origin (toolkit remote)
  2. diff .claude/skills/, .claude/agents/, .claude/rules/ vs upstream
  3. Report: new files / changed files / removed files
  4. User approve → apply selective update
  5. Backup dv-workflow.config.yml trước khi merge
  ```
- **Files**: `.claude/skills/upgrade/SKILL.md` (new), `scripts/upgrade.sh` (new)

### Theme 3: Developer Experience

#### English Language Support
- Implement `language: "en"` trong config
- Tạo bộ skill instructions tiếng Anh song song hoặc switch theo config
- Template files bilingual hoặc language-specific
- Priority: docs output templates trước (context.md, plan.md, progress.md)
- **Files**: `templates/en/` (new directory), update tất cả SKILL.md để check language flag

#### Thinking Skill User-Invocable
- Đổi `user-invocable: false` → `true` trong thinking SKILL.md
- Thêm usage examples: `/dw-thinking "Should I use microservices or monolith?"`
- **Files**: `.claude/skills/thinking/SKILL.md`

#### Custom Skill Extension Guide
- Viết `docs/custom-skills.md`: convention, template, cách add `/dw-deploy`, `/dw-migration`
- Tạo `examples/custom-skill-template/` với scaffold
- **Files**: `docs/custom-skills.md` (new), `examples/custom-skill-template/` (new)

### Theme 4: Metrics Foundation

#### Standardize `effort-log.json` Schema
- Định nghĩa JSON schema cho effort log
- Update `log-work` SKILL để output đúng schema
- Update `dashboard` SKILL để read từ schema
- **Files**: `schemas/effort-log.schema.json` (new), update SKILL.md cho log-work, dashboard

### From Existing Roadmap

| Item | Status | Notes |
|------|--------|-------|
| `sprint-review` skill | Add | Cho team retrospective — summary + lessons learned |
| DORA metrics improvement | Improve | Tính toán tự động từ git history thay vì manual |
| `thinking` skill improvements | Add | User-invocable + direct invocation support |

### Deliverables v0.2.0

- [ ] `config.schema.json` + `config-validate` skill
- [ ] `tests/smoke-test.sh`
- [ ] `upgrade` skill + `scripts/upgrade.sh`
- [ ] `templates/en/` — English templates
- [ ] `docs/custom-skills.md`
- [ ] `schemas/effort-log.schema.json`
- [ ] `sprint-review` skill
- [ ] Improved DORA auto-calculation

---

## v0.3.0 — Level 3 Completion + CI/CD

> **Mục tiêu**: Level 3 fully operational. Toolkit tích hợp vào pipeline thực tế.
> **Target**: Team 5-15 người, có CI/CD pipeline, cần metrics thực sự.

### Theme 1: Level 3 Full Workflow

#### Living Docs Automation
- `docs-update` SKILL tự động detect thay đổi trong code và update:
  - `ARCHITECTURE.md` — khi thêm/xóa module
  - `API.md` — khi thêm/xóa endpoint
  - `DATA-MODELS.md` — khi thay đổi schema
- Trigger: post-commit hook hoặc post-execute
- **Files**: Update `docs-update` SKILL, thêm living docs templates

#### Dashboard HTML Export
- `dashboard` SKILL generate report dạng markdown + HTML
- Include: task velocity, DORA metrics, effort tracking, team health
- Export tới `.dev-reports/` directory
- **Files**: Update `dashboard` SKILL.md, tạo `templates/dashboard.html.template`

#### Level 3 Config Templates
- Tạo `project-templates/enterprise/dv-workflow.config.yml`
- Bật full Level 3 flags với sensible defaults
- **Files**: `project-templates/enterprise/dv-workflow.config.yml` (new)

### Theme 2: CI/CD Integration

#### GitHub Actions Templates
- `ci-quality-gate.yml` — chạy lint + test trên PR
- `ci-docs-check.yml` — kiểm tra docs up-to-date
- Không require toolkit, nhưng tích hợp với workflow hooks
- **Files**: `.github/workflows/` templates trong `examples/ci-templates/`

#### GitLab CI Template (optional)
- Tương tự GitHub Actions nhưng cho GitLab
- **Files**: `examples/ci-templates/gitlab-ci.yml`

### Theme 3: Rollback Mechanism

> Giải quyết failure mode: "nếu plan sai → execute sai → không biết revert"

- `task-init` tự động snapshot trạng thái docs khi bắt đầu
- Thêm `/dw-rollback [task-name]` skill: revert task docs về checkpoint
- Git-based: dùng git stash hoặc branch cho task docs
- **Files**: Update `task-init` SKILL, tạo `rollback` SKILL (new)

### Theme 4: Task Archival

- Task docs cũ (done > 30 ngày) tự động move vào `.dev-tasks/archive/`
- `/dw-archive [task-name]` skill manual trigger
- Giải quyết scaling concern: `.dev-tasks/` directory messy với nhiều tasks
- **Files**: `archive` SKILL (new), update `task-init` SKILL

### Deliverables v0.3.0

- [ ] Living docs automation — `docs-update` enhanced
- [ ] Dashboard HTML export
- [ ] `project-templates/enterprise/` config
- [ ] `examples/ci-templates/` — GitHub Actions, GitLab CI
- [ ] `rollback` skill
- [ ] `archive` skill
- [ ] Level 3 fully tested và documented

---

## v0.4.0 — Ecosystem: MCP + Community

> **Mục tiêu**: Mở rộng ecosystem. Tích hợp external tools. Community contribution.
> **Target**: Teams dùng Jira/Linear/GitHub Projects, cộng đồng contributors.

### Theme 1: MCP Integration

> Từ existing roadmap: "MCP integration cho external sync"

#### External Tool Sync
- `mcp-jira` connector: sync task → Jira issue
- `mcp-github` connector: sync task → GitHub Issue/Project
- `mcp-linear` connector: sync với Linear
- Config: `metrics.export.external_sync: "jira"` (đã có placeholder trong config)
- **Architecture**: MCP server adapter pattern — toolkit gọi MCP, MCP gọi external API

#### Implementation
- Tạo `mcp/` directory với adapter specs
- Update `task-init`, `log-work`, `dashboard` SKILL để trigger sync nếu configured
- **Files**: `mcp/jira-adapter.md`, `mcp/github-adapter.md`, update relevant SKILLs

### Theme 2: Platform Abstraction (v0.4 hoặc v1.0)

> Giải quyết W2: tightly coupled với Claude Code CLI

**Phân tích trade-off**:
- Claude Code coupling là intentional trade-off trong v0.x — OK
- Cần revisit cho v1.0 nếu muốn broader adoption
- Option A: Adapter layer (abstract `$ARGUMENTS`, agent delegation)
- Option B: Document Claude-specific parts rõ ràng, tạo "porting guide" cho Cursor/Copilot
- **Recommendation**: Option B trước (ít effort, unblock community), Option A sau nếu demand cao

### Theme 3: Community

#### Community Skill Marketplace
- Convention: community skills trong `community-skills/` hoặc separate repo
- Submit via PR với template `examples/custom-skill-template/`
- Skills review process: smoke test + documentation check
- **Files**: `CONTRIBUTING.md` (new), `community-skills/README.md` (new)

#### Porting Guide (nếu chọn Option B)
- `docs/porting-guide.md`: cách adapt toolkit cho Cursor, Windsurf, Copilot Chat
- Document: Claude-specific syntax, alternatives, what changes needed
- **Files**: `docs/porting-guide.md` (new)

### Deliverables v0.4.0

- [ ] MCP Jira adapter
- [ ] MCP GitHub adapter
- [ ] `CONTRIBUTING.md` + community skill process
- [ ] Platform porting guide
- [ ] Community skills examples (2-3 submitted skills)

---

## Cross-Version: Ongoing

Những việc cần làm xuyên suốt các versions:

| Hạng mục | Hành động |
|----------|-----------|
| Claude API compatibility | Monitor Claude Code CLI changes, update skill syntax khi cần |
| Config backward compat | Khi thêm key mới vào schema, phải có default value — không break existing configs |
| CHANGELOG | Cập nhật sau mỗi version, trước khi tag |
| Adoption metrics | Track: onboarding time, skill usage frequency, dropout points |

---

## Dependency Map

```
v0.1.x (patch)
  └── no dependencies — fix existing

v0.2.0
  ├── depends on: v0.1.x (C3 config validation foundation)
  └── provides: schema, tests, upgrade path

v0.3.0
  ├── depends on: v0.2.0 (effort-log schema, English support)
  └── provides: Level 3 complete, CI/CD

v0.4.0
  ├── depends on: v0.3.0 (stable core, archival)
  └── provides: external integrations, community
```

---

## Metrics Thành Công

| Version | KPI | Target |
|---------|-----|--------|
| v0.1.x | First impression: clone → understand trong | < 5 phút |
| v0.2.0 | Onboarding time | < 1 ngày |
| v0.2.0 | Config typo detection rate | 100% known keys validated |
| v0.3.0 | Level 3 feature completeness | 100% flags hoạt động |
| v0.4.0 | Community skills submitted | >= 5 skills |

---

---

## v1.0.0 — Production-Ready: Trial Project-Team

> **Mục tiêu**: Một team thực sự có thể adopt toolkit này cho dự án thật, không cần biết tác giả.
> **Definition of Done**: Team 3-8 người, onboard trong < 1 ngày, chạy ổn định trong 1 sprint (2 tuần).
> **Open-source target**: Đây là milestone để public release.

### Tiêu Chí Production-Ready

#### 1. Stable API — Không Breaking Changes
- Tất cả skill names, config keys, template file names đã cố định
- Nếu phải thay đổi: có migration guide rõ ràng
- `upgrade` skill (từ v0.2) hoạt động đáng tin cậy
- **Cam kết**: v1.x sẽ backward-compatible với v1.0 config

#### 2. Full Team Role Coverage
- Tất cả roles hoạt động end-to-end: Dev, TL, BA, QC, PM
- Multi-role workflow (BA → TL → Dev → QC → PM) được test với scenario thực
- Không còn skill nào ở trạng thái "planned" hoặc "beta" — hoặc phải label rõ

#### 3. Level 1, 2, 3 Đều Hoạt Động
- Level 1 & 2: đã ổn từ v0.3
- Level 3: living docs, DORA metrics, dashboard — fully functional
- Config `level: 3` không còn cảnh báo beta

#### 4. Onboarding Tự Phục Vụ
- Người mới clone → đọc README → chạy được trong < 1 ngày, không cần hỏi tác giả
- `config-init` skill chạy interactive setup (hỏi team size, roles, level)
- Có ít nhất 1 tutorial step-by-step với project thật (không phải demo giả)
- Error messages rõ ràng, có hướng dẫn fix

#### 5. Quality Gates Tin Cậy
- `pre-commit-gate.sh` chạy đúng trên macOS, Linux, Windows (Git Bash)
- YAML parsing robust (C2 fix từ v0.1.x đã verified)
- Hook scripts có unit tests
- Không có silent failure modes còn tồn tại

#### 6. Documentation Hoàn Chỉnh
- Root `README.md` professional (hero, badges, quick start, demo GIF/screenshot)
- `docs/` đầy đủ: setup, concepts, all skills reference, troubleshooting
- English & Vietnamese đều hoàn chỉnh
- CHANGELOG đầy đủ từ v0.1 → v1.0

#### 7. Dogfooding Verified
- Toolkit đã được dùng để develop chính nó (ít nhất 1 sprint)
- Ít nhất 1 trial team (internal) dùng cho dự án thật và cho feedback
- Known issues từ trial đã được fix hoặc documented

### Checklist Trước Khi Tag v1.0

```
STABILITY
[ ] Zero known critical bugs
[ ] All skills tested on macOS + Linux + Windows (Git Bash)
[ ] Upgrade path từ v0.x → v1.0 documented và tested

COMPLETENESS
[ ] Level 1, 2, 3 fully functional
[ ] All 5 roles (Dev/TL/BA/QC/PM) có skill hoạt động
[ ] English templates complete
[ ] Config validation catches all known error types

DOCUMENTATION
[ ] Root README với quick start < 5 phút
[ ] Full skills reference (all 17+ skills)
[ ] Troubleshooting guide (top 10 common issues)
[ ] Migration guide từ v0.x
[ ] At least 1 real-project tutorial (không phải demo)

QUALITY
[ ] Self-tests pass (smoke tests từ v0.2)
[ ] Hook scripts cross-platform tested
[ ] No silent failure modes

TRIAL
[ ] >= 1 internal team đã dùng >= 1 sprint
[ ] Trial feedback đã được incorporate
[ ] Onboarding time measured: target < 1 ngày
```

### Không Thuộc Scope v1.0
- MCP external sync (v0.4 — nice to have, không block)
- Community skill marketplace
- Multi-platform support (Cursor/Windsurf)
- Automated metrics dashboard CI

---

## Quyết Định Đã Chốt

| # | Quyết định | Lựa chọn | Ghi chú |
|---|-----------|----------|---------|
| 1 | **English support structure** | Separate dirs: `templates/vi/`, `templates/en/` | Đơn giản hơn để maintain, tránh file phức tạp |
| 2 | **Platform coupling** | Claude-only cho v0.x–v1.0, focus depth | Cursor/Windsurf có thể support trong version tương lai (v2.x+) |
| 3 | **Open-source timing** | Sau v1.0 | Đảm bảo API stable, feature complete trước khi public |
| 4 | **MCP vs direct API** | Pending — quyết định trong v0.4 | Chưa cần thiết cho v0.2–v0.3 |

---

*Document này là living plan — cập nhật sau mỗi version release.*
