# Plan: dw-kit-v1.2-upgrade

## Ngày tạo: 2026-04-02
## Trạng thái: Draft
## Approved by: —

---

## Tóm Tắt Giải Pháp

Nâng cấp DW-kit lên v1.2 theo 4 layers tăng dần complexity:
1. **Hooks layer** — Engineering enforcement (không cần user làm gì)
2. **Agent communication layer** — File-based reports protocol
3. **Parallel execution layer** — Subagents cho independent subtasks
4. **UX layer** — Socratic kickoff + session continuity

Mỗi layer độc lập, có thể ship riêng. Không breaking existing usage.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | Incremental per-layer (4 phases) | Ship sớm, verify từng bước, backward compat | Chậm hơn full rewrite | **Chọn** |
| 2 | Full rewrite từ claudekit boilerplate | Faster nếu thành công | High risk, break existing teams | Loại |
| 3 | Fork claudekit + customize | Ready-made | $99, mất unique DW advantages | Loại |

---

## Phase 1: Hooks Layer (Priority 1 — Ship First)

> **Mục tiêu:** Enforcement không cần user làm gì. Học từ claudekit hooks engineering.

### ST-1.1: Scout-block hook (performance)

- **Mô tả**: Port `scout-block.cjs` từ claudekit — block heavy dirs (node_modules, dist, .git, .tmp) trước khi agent đọc. Cross-platform (Windows/Unix/WSL).
- **Files**:
  - `.claude/hooks/scout-block.cjs` (mới)
  - `.claude/settings.json` (thêm hook registration)
- **Acceptance Criteria**:
  - [ ] Hook chạy trước mỗi Read/Glob tool call
  - [ ] Block pattern: `node_modules/`, `dist/`, `build/`, `.git/`, `.tmp/`, `__pycache__/`
  - [ ] Windows path compatible
  - [ ] Log khi block: "Blocked heavy dir: [path]"
  - [ ] Không ảnh hưởng reads trong `.dw/`, `.claude/`, `src/`
- **Dependencies**: none
- **Verify**: Thử `Read node_modules/...` → thấy blocked message

### ST-1.2: Privacy-block hook (security)

- **Mô tả**: Block đọc sensitive files (`.env*`, `*credentials*`, `*secret*`, `*.pem`) trừ khi user explicit confirm. Học từ claudekit `privacy-block.cjs`.
- **Files**:
  - `.claude/hooks/privacy-block.cjs` (mới)
  - `.claude/settings.json` (register)
- **Acceptance Criteria**:
  - [ ] Block pattern: `.env`, `.env.*`, `*credentials*`, `*secrets*`, `*.pem`, `*.key`
  - [ ] Intercept trước Read tool
  - [ ] Message rõ: "Sensitive file detected: [path]. Confirm để đọc?"
  - [ ] Allow-list: `.env.example`, `.env.sample`
- **Dependencies**: none
- **Verify**: Thử đọc `.env` → thấy warning

### ST-1.3: Session-init hook (context injection)

- **Mô tả**: Inject active task context vào đầu mỗi session. Tìm task đang `In Progress` trong `.dw/tasks/` và inject progress file vào system context. Giải session amnesia.
- **Files**:
  - `.claude/hooks/session-init.cjs` (mới)
  - `.claude/settings.json` (register UserPromptSubmit)
- **Acceptance Criteria**:
  - [ ] Trigger on first UserPromptSubmit mỗi session
  - [ ] Scan `.dw/tasks/*/[name]-progress.md` tìm `In Progress`
  - [ ] Nếu có: inject summary vào system prompt
  - [ ] Nếu nhiều task: list và hỏi user chọn
  - [ ] Nếu không có task active: skip silently
- **Dependencies**: ST-1.1 (không block `.dw/`)
- **Verify**: Start session mới khi có task In Progress → thấy context được inject

### ST-1.4: Post-task quality hook

- **Mô tả**: Sau khi agent complete task (PostToolUse Write/Edit), remind về quality checks nếu `quality.test_command` hoặc `lint_command` đã config. Nhẹ nhàng hơn hard-block.
- **Files**:
  - `.claude/hooks/post-edit-quality.cjs` (mới)
  - `.claude/settings.json` (register PostToolUse)
- **Acceptance Criteria**:
  - [ ] Chỉ trigger khi `block_on_fail: true` trong config
  - [ ] Read `.dw/config/dw.config.yml` để lấy commands
  - [ ] Print reminder: "Quality gate: run [test_command]?"
  - [ ] Không block nếu không có command configured
- **Dependencies**: none

---

## Phase 2: Agent Communication Layer (Priority 1)

> **Mục tiêu:** Structured file-based reports giữa agents. Học từ claudekit orchestration protocol.

### ST-2.1: Reports directory convention + schema

- **Mô tả**: Định nghĩa convention cho agent communication reports trong DW tasks. Tạo schema và template.
- **Files**:
  - `.claude/templates/agent-report.md` (mới — report template)
  - `core/AGENTS.md` (mới — agent communication guide)
  - `CLAUDE.md` (update — mention reports protocol)
- **Convention**:
  ```
  .dw/tasks/[task-name]/reports/
  └── [YYMMDD-HHMM]-from-[agent]-to-[agent]-[description].md
  ```
- **Status codes**: `DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`
- **Acceptance Criteria**:
  - [ ] Template file có YAML frontmatter: date, from, to, task, status
  - [ ] Schema documented trong `core/AGENTS.md`
  - [ ] CLAUDE.md mention khi nào dùng reports
- **Dependencies**: none

### ST-2.2: Update dw-research skill để emit reports

- **Mô tả**: Sau khi research xong, `dw-research` tạo report file `from-researcher-to-planner-*.md` thay vì chỉ update context.md.
- **Files**:
  - `.claude/skills/dw-research/SKILL.md` (update)
- **Acceptance Criteria**:
  - [ ] Cuối skill: tạo report file trong `.dw/tasks/[name]/reports/`
  - [ ] Report có status `DONE` + summary findings
  - [ ] context.md vẫn được update như cũ (backward compat)
- **Dependencies**: ST-2.1

### ST-2.3: Update dw-plan skill để read reports + emit

- **Mô tả**: `dw-plan` đọc research reports từ `.dw/tasks/[name]/reports/` làm input; sau khi xong tạo report `from-planner-to-developer-*.md`.
- **Files**:
  - `.claude/skills/dw-plan/SKILL.md` (update)
- **Acceptance Criteria**:
  - [ ] Skill đọc reports từ reports/ dir nếu tồn tại
  - [ ] Plan.md vẫn là output chính
  - [ ] Tạo report với status và key decisions
- **Dependencies**: ST-2.1, ST-2.2

---

## Phase 3: Parallel Execution Layer (Priority 2)

> **Mục tiêu:** Spawn parallel subagents cho independent research/subtasks. 3-4x faster.

### ST-3.1: dw-parallel skill (orchestrator)

- **Mô tả**: Skill mới cho phép spawn multiple independent subagents. Dùng Claude Code `Agent` tool. Tổng hợp kết quả qua reports.
- **Files**:
  - `.claude/skills/dw-parallel/SKILL.md` (mới)
  - `.claude/skills/dw-parallel/SKILL-GUIDE.md` (usage examples)
- **Use cases**:
  - Parallel research: nhiều aspects của cùng problem
  - Parallel subtask execution (chỉ khi independent)
- **Acceptance Criteria**:
  - [ ] Skill accept list of independent tasks
  - [ ] Spawn subagents với isolated context
  - [ ] Wait for all → tổng hợp vào summary report
  - [ ] Report conflicts nếu có
- **Dependencies**: ST-2.1

### ST-3.2: Update dw-research để hỗ trợ parallel mode

- **Mô tả**: Khi task scope lớn (thorough depth), `dw-research` spawn parallel researcher subagents cho different aspects.
- **Files**:
  - `.claude/skills/dw-research/SKILL.md` (update)
- **Acceptance Criteria**:
  - [ ] Chỉ trigger khi `default_depth: thorough` hoặc user request
  - [ ] Tối đa 3 parallel researchers
  - [ ] Mỗi researcher focus vào một aspect rõ ràng
  - [ ] Kết quả merge vào single context.md
- **Dependencies**: ST-3.1

### ST-3.3: Update dw-execute để parallel subtasks

- **Mô tả**: Trong execute phase, nếu subtasks independent nhau, spawn parallel implementers.
- **Files**:
  - `.claude/skills/dw-execute/SKILL.md` (update)
- **Acceptance Criteria**:
  - [ ] Detect independent subtasks từ plan (no dependencies)
  - [ ] Spawn executors trong worktrees (nếu `worktree_execution: true`)
  - [ ] Sequential fallback nếu dependencies exist
- **Dependencies**: ST-3.1, ST-2.3

---

## Phase 4: UX Layer (Priority 2)

> **Mục tiêu:** Better developer experience — socratic kickoff, profile presets.

### ST-4.1: Socratic task kickoff trong dw-plan

- **Mô tả**: Trước khi plan, skill hỏi 3-5 câu clarification để surface hidden requirements. Học từ superpowers brainstorm.
- **Files**:
  - `.claude/skills/dw-plan/SKILL.md` (update)
- **Questions template**:
  1. Tech stack constraint nào? (language, framework, version)
  2. Scope boundary: gì thuộc task này, gì không?
  3. Quality expectations: performance, security, backward compat?
  4. Timeline: có deadline cứng không?
  5. Ai sẽ review/approve plan?
- **Acceptance Criteria**:
  - [ ] Chỉ hỏi khi task context.md chưa có answers
  - [ ] Skip nếu user đã provide đủ context
  - [ ] Câu hỏi concise, không spam
- **Dependencies**: none

### ST-4.2: Config profiles preset

- **Mô tả**: Thêm `profiles` vào `dw.config.yml` schema: preset configs cho common setups.
- **Files**:
  - `.dw/config/dw.config.yml` (template update)
  - `src/commands/init.mjs` (profile selection)
  - `src/commands/validate.mjs` (validate profile values)
- **Profiles**:
  - `startup`: quick depth, minimal tracking, 1-2 roles
  - `team`: standard depth, dev + techlead, estimation on
  - `enterprise`: thorough depth, all roles, block_on_fail true
- **Acceptance Criteria**:
  - [ ] `dw init` hỏi chọn profile
  - [ ] Profile pre-fills config values
  - [ ] validate command kiểm tra profile values hợp lệ
- **Dependencies**: none

### ST-4.3: Update CLAUDE.md và core docs cho v1.2

- **Mô tả**: Cập nhật toàn bộ instructions, thêm v1.2 features vào routing table, agents section.
- **Files**:
  - `CLAUDE.md` (major update)
  - `core/WORKFLOW.md` (update phases)
  - `README.md` (user-facing)
- **Acceptance Criteria**:
  - [ ] Mention hooks layer
  - [ ] Mention agent communication protocol
  - [ ] Mention parallel execution
  - [ ] Backward compat note cho v1 users
- **Dependencies**: ST-1.x, ST-2.x, ST-3.x done

---

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | Hook CJS format compatible với dw-kit | Cao | High | Test ngay ST-1.1 trước |
| 2 | Rủi ro | Parallel agents conflict khi write cùng file | TB | High | Convention: mỗi agent chỉ write file của nó |
| 3 | Giả định | `.claude/agents/` dir format như claudekit | TB | Medium | Verify với `dw doctor` sau ST-1 |
| 4 | Rủi ro | Hooks làm chậm agent response | Thấp | Medium | Benchmark trước/sau scout-block |
| 5 | Rủi ro | Teams không adopt v1.2 features | TB | Low | v1.2 fully backward compatible, opt-in |

## Edge Cases

- [ ] User có task `.dw/tasks/` nhưng không có `In Progress` status → session-init skip silently
- [ ] Scout-block chạy trên path chứa `node_modules` trong tên khác → whitelist logic
- [ ] Parallel agents fail giữa chừng → partial results vẫn được capture trong reports
- [ ] Config thiếu `paths.tasks` → fallback về `.dw/tasks` mặc định
- [ ] Reports dir không tồn tại khi skill cố đọc → create on demand

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: `.claude/hooks/`, `.claude/skills/`, `CLAUDE.md`, `core/`
- **API changes**: không (CLI commands không thay đổi)
- **Database changes**: không
- **Backward compatibility**: Có — Phase 1-2 fully additive; Phase 3-4 opt-in
- **Breaking changes**: không

## Góc Nhìn & Trade-offs

| Quyết định | Developer | Teams (10 devs) | Maintainer |
|-----------|-----------|-----------------|------------|
| Hooks CJS (không Bash) | Cross-platform safer | Transparent | Dễ debug |
| File-based reports | Audit trail | Learning curve | Simple to extend |
| Parallel opt-in (không default) | Flexibility | No forced change | Easier rollout |
| Profile presets | Fast onboard | Standardized | Reduce support |

## Thứ Tự Ưu Tiên Ship

```
Week 1:  ST-1.1 + ST-1.2 (scout + privacy hooks) — immediate value
Week 1:  ST-2.1 (reports schema) — foundation for rest
Week 2:  ST-1.3 (session-init) + ST-2.2/2.3 (skills emit reports)
Week 3:  ST-3.1 + ST-3.2 (parallel skill + research)
Week 4:  ST-1.4 + ST-3.3 + ST-4.x (polish + docs)
```
