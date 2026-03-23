# Plan: dw-kit v2 Upgrade

## Ngày tạo: 2026-03-23
## Trạng thái: Approved
## Approved by: huygdv (via conversation review + 7-question analysis)

---

## Tóm Tắt Giải Pháp

Restructure dw-kit theo kiến trúc 4 lớp: Core (portable methodology) → Platform (Claude Code execution) → Capability (model features) → Extension (team overrides). Research và planning đã hoàn thành qua `docs/plan-v2-flexible-first.md` và `docs/strategy-v2-claude-optimized.md`.

Approach: migrate incrementally theo 5 phases, không break workflow hiện tại, commit sau mỗi subtask.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | 4-layer + reference injection | Portable core, Claude-optimized execution, upgrade-safe | Phức tạp hơn 2-layer | **Chọn** |
| 2 | Full-generation từ WORKFLOW.md | Đơn giản | Mất Claude-specific nuances, fragile | Loại |
| 3 | Giữ nguyên v0.3, chỉ add portability | Ít breaking | Không giải quyết root cause | Loại |

---

## PHASE A — Core + Loading Strategy

### ST-A1: Tạo `core/WORKFLOW.md` — 6-phase methodology
- **Mô tả**: Consolidate methodology từ 22 skills thành 6 phases có section anchors. KHÔNG chứa Claude-specific syntax. Có guided questions per phase.
- **Files**: `core/WORKFLOW.md` (new)
- **Acceptance Criteria**:
  - [ ] 6 phases: Initialize → Understand → Plan → Execute → Verify → Close
  - [ ] Section anchors: `<!-- @phase:X -->`
  - [ ] Guided questions per phase (không blank templates)
  - [ ] Version header: `<!-- core-version: 2.0 -->`
  - [ ] Standalone workflows: Debug, Reports
- **Dependencies**: none

### ST-A2: Tạo `core/THINKING.md`, `core/QUALITY.md`, `core/ROLES.md`
- **Mô tả**: Move existing THINKING.md content, tạo mới QUALITY.md (4-layer strategy) và ROLES.md (role definitions).
- **Files**: `core/THINKING.md`, `core/QUALITY.md`, `core/ROLES.md` (all new)
- **Acceptance Criteria**:
  - [ ] THINKING.md = content từ `.claude/skills/thinking/THINKING.md` + First Principles section
  - [ ] QUALITY.md = 4 layers: Requirements Clarity, TDD, Cross-Review, QA Gates
  - [ ] ROLES.md = BA/TL/Dev/QC/PM với decision authority per phase
- **Dependencies**: none

### ST-A3: Redesign `CLAUDE.md` → tiered loading
- **Mô tả**: Rewrite CLAUDE.md thành ~150 lines. Chứa routing + skill index. KHÔNG load WORKFLOW.md. Skills tự load context khi invoke.
- **Files**: `CLAUDE.md` (rewrite)
- **Acceptance Criteria**:
  - [ ] ≤ 200 lines
  - [ ] Version header tracking core/platform version
  - [ ] Compact routing table
  - [ ] Skill index (names + brief description)
  - [ ] Instruction: "load @core/WORKFLOW.md on demand, không always-load"
- **Dependencies**: ST-A1

---

## PHASE B — Layer 3: Upgrade-Safe Structure

### ST-B1: Tạo `adapters/claude-cli/` directory structure
- **Mô tả**: Tạo 3 subdirectories với README giải thích mục đích mỗi thư mục.
- **Files**: `adapters/claude-cli/generated/`, `adapters/claude-cli/overrides/`, `adapters/claude-cli/extensions/` (dirs + READMEs)
- **Acceptance Criteria**:
  - [ ] 3 directories tồn tại
  - [ ] Mỗi dir có README.md giải thích convention
  - [ ] `.gitkeep` trong empty dirs
- **Dependencies**: none

### ST-B2: Tạo `scripts/upgrade.sh` — override-aware
- **Mô tả**: Upgrade script đọc overrides/ và không overwrite chúng. Merge settings.json thay vì overwrite.
- **Files**: `scripts/upgrade.sh` (new)
- **Acceptance Criteria**:
  - [ ] Detect và skip files có matching override
  - [ ] Copy extensions/ mà không conflict
  - [ ] Merge settings.json (không overwrite)
  - [ ] Log rõ ràng: "Applied override: X", "Preserved customization: Y"
  - [ ] `--dry-run` flag để preview
- **Dependencies**: ST-B1

### ST-B3: Tạo `scripts/migrate-v03-to-v2.sh`
- **Mô tả**: Migration script cho user đang dùng v0.3. Map config cũ → mới, preserve customizations, symlink backward compat.
- **Files**: `scripts/migrate-v03-to-v2.sh` (new)
- **Acceptance Criteria**:
  - [ ] Detect `dv-workflow.config.yml` và migrate → `config/dw.config.yml`
  - [ ] Map `level: 1/2/3` → `default_depth: quick/standard/thorough`
  - [ ] Detect customized SKILL.md và copy → `adapters/claude-cli/overrides/`
  - [ ] Tạo symlink `dv-workflow.config.yml` → `config/dw.config.yml`
  - [ ] Warn nếu có CI/CD references cần update thủ công
  - [ ] `--dry-run` flag
- **Dependencies**: ST-B1

---

## PHASE C — Layer 1: Enhanced Claude Execution

### ST-C1: Enhance 4 agents hiện tại
- **Mô tả**: Nâng cấp researcher (confidence output), planner (deep reasoning protocol), reviewer (JSON output), quality-checker (structured). Tạo executor agent mới.
- **Files**: `.claude/agents/researcher.md`, `.claude/agents/planner.md`, `.claude/agents/reviewer.md`, `.claude/agents/executor.md` (new)
- **Acceptance Criteria**:
  - [ ] researcher: output có `confidence: HIGH/MEDIUM/LOW` per finding
  - [ ] planner: Deep Analysis Protocol section (≥3 approaches, devil's advocate)
  - [ ] reviewer: JSON block cuối output theo schema `{approved, score, critical[], warnings[], suggestions[]}`
  - [ ] executor: tools=[Read,Write,Edit,Bash,Grep,Glob], disallowedTools=[NotebookEdit], có worktree note
- **Dependencies**: ST-A1 (planner references WORKFLOW.md)

### ST-C2: Tạo 3 hook scripts mới + update settings.json
- **Mô tả**: Tạo safety-guard.sh (intercept destructive commands), post-write.sh (auto-lint per file), progress-ping.sh (remind update progress). Update settings.json với 4-hook system.
- **Files**: `.claude/hooks/safety-guard.sh`, `.claude/hooks/post-write.sh`, `.claude/hooks/progress-ping.sh`, `.claude/settings.json`
- **Acceptance Criteria**:
  - [ ] safety-guard.sh: block `rm -rf` không có specific path, `git push --force` yêu cầu confirm, destructive SQL
  - [ ] post-write.sh: run lint_command (từ config) trên file vừa write (non-blocking)
  - [ ] progress-ping.sh: check active task, remind nếu in-progress (non-blocking)
  - [ ] settings.json: 4 hooks (PreToolUse/Bash×2, PostToolUse/Write|Edit, Stop, Notification)
  - [ ] settings.json: `mcpServers: {}` slot (empty but present)
- **Dependencies**: none

---

## PHASE D — Config + Layer 2

### ST-D1: Tạo `config/dw.config.yml` (redesigned)
- **Mô tả**: Config mới ~40 lines với `claude:` section (model selection, structured_output, worktree_execution, mcp).
- **Files**: `config/dw.config.yml` (new), `config/presets/solo-quick.yml`, `config/presets/small-team.yml`, `config/presets/enterprise.yml`
- **Acceptance Criteria**:
  - [ ] `workflow.default_depth` thay thế `level`
  - [ ] `team.roles` thay thế 17 feature flags
  - [ ] `quality.test_command` + `lint_command` (actionable, không chỉ true/false)
  - [ ] `claude:` section với models, structured_output, worktree_execution, mcp
  - [ ] `_toolkit.core_version` + `platform_version` tracking
  - [ ] 3 preset files
- **Dependencies**: none

### ST-D2: Tạo `config/config.schema.json`
- **Mô tả**: JSON Schema validate config file. Detect unknown keys, wrong types, invalid enum values.
- **Files**: `config/config.schema.json` (new)
- **Acceptance Criteria**:
  - [ ] Schema cover tất cả keys trong dw.config.yml
  - [ ] Enum validation cho `default_depth` (quick/standard/thorough)
  - [ ] Enum validation cho `team.roles` values
  - [ ] `additionalProperties: false` cho strict validation
- **Dependencies**: ST-D1

### ST-D3: Update `setup.sh` — generate settings.json từ config
- **Mô tả**: setup.sh đọc `claude.mcp[]` từ config và generate `.claude/settings.json` với đúng `mcpServers` block. Thêm platform detection cho Layer 2.
- **Files**: `setup.sh` (update)
- **Acceptance Criteria**:
  - [ ] Detect `claude.mcp` trong config → generate mcpServers block
  - [ ] Validate config với schema sau khi generate
  - [ ] Backward compat: nếu dùng `dv-workflow.config.yml`, auto-detect và note migration path
- **Dependencies**: ST-D1, ST-D2, ST-C2 (settings.json template)

---

## PHASE E — Core Templates + Adapters

### ST-E1: Tạo `core/templates/vi/` — guided questionnaires
- **Mô tả**: Redesign 3 template files từ blank → guided questionnaires với readiness hints.
- **Files**: `core/templates/vi/task-context.md`, `core/templates/vi/task-plan.md`, `core/templates/vi/task-progress.md`
- **Acceptance Criteria**:
  - [ ] context.md: structured questions thay blank fields
  - [ ] plan.md: approach comparison table + subtask với acceptance criteria
  - [ ] progress.md: sprint-aware (sprint ID field), handoff notes section
- **Dependencies**: ST-A1

### ST-E2: Tạo generic adapter (`adapters/generic/AGENT.md`)
- **Mô tả**: Single file cho bất kỳ AI tool nào. Combine WORKFLOW.md summary + config reference. Honest về limitations (không replicate agent delegation).
- **Files**: `adapters/generic/AGENT.md` (new), `adapters/generic/README.md`
- **Acceptance Criteria**:
  - [ ] Zero platform syntax
  - [ ] Clear "Limitations" section: không có agent delegation, không có hooks
  - [ ] Workflow summary đủ để follow mà không cần full WORKFLOW.md
- **Dependencies**: ST-A1

### ST-E3: Update docs, README, CHANGELOG
- **Mô tả**: Update README.md main + docs/ để reflect v2 structure. CHANGELOG entry cho v2.
- **Files**: `README.md`, `docs/README.md`, `CHANGELOG.md`
- **Acceptance Criteria**:
  - [ ] README có v2 directory structure
  - [ ] Migration guide: v0.3 → v2 (tóm tắt, link đến migrate script)
  - [ ] CHANGELOG: v2.0.0 entry với breaking changes listed
- **Dependencies**: tất cả phases trước

---

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Rủi ro | WORKFLOW.md quá dài → khó maintain | Cao | Trung bình | TOC rõ ràng + section anchors |
| 2 | Rủi ro | Migration script miss edge cases | Trung bình | Cao | `--dry-run` flag + warn thay vì silent |
| 3 | Giả định | JSON output từ reviewer reliable | Trung bình | Trung bình | Fallback: markdown output vẫn là primary |
| 4 | Rủi ro | setup.sh YAML parsing fragile | Cao | Cao | Dùng python3 yaml parser (đã có dependency) |

## Edge Cases

- [ ] User có dv-workflow.config.yml và dw.config.yml đồng thời → ưu tiên dw.config.yml, warn
- [ ] overrides/ có file nhưng generated/ không có file đó → copy override như extension
- [ ] MCP server config nhưng claude code version không hỗ trợ → graceful skip với warning
- [ ] WORKFLOW.md load trong context window đầy → note trong CLAUDE.md để load sections

## Tác Động Hệ Thống

- **Breaking changes**: config rename (`dv-workflow.config.yml` → `config/dw.config.yml`), level system removed → migration script xử lý
- **Backward compatibility**: symlink `dv-workflow.config.yml` → `config/dw.config.yml` trong 1 release
- **Không thay đổi**: `.dw/tasks/` structure, template format, git commit conventions
