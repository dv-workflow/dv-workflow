# dw-kit v2 — Flexible-First Radical Simplification Plan

> **Status**: Draft — Pending cross-review
> **Tác giả**: Cursor AI Agent (Claude) + huygdv
> **Ngày**: 2026-03-23
> **Scope**: Restructure toàn bộ dw-kit từ v0.3 (22 skills, Claude-coupled) sang v2 (portable core + adapters)
> **Phương pháp**: First Principles Thinking + Critical Thinking + Systems Thinking + Multi-Perspective

---

## Tóm Tắt Cho Reviewer

**Vấn đề**: dw-kit v0.3 có 22 SKILL.md + 4 agents + 3 rules + 1 hook = 30+ files, tất cả tightly coupled với Claude Code CLI syntax (`$ARGUMENTS`, `context: fork`, `allowed-tools`, `.claude/` convention). Không thể dùng với Cursor, Copilot, Windsurf, hoặc bất kỳ AI tool nào khác mà không viết lại. Với tốc độ AI tiến hóa hiện tại, kiến trúc này sẽ nhanh chóng bị lỗi thời.

**Giải pháp**: Tách "methodology" (timeless) khỏi "platform syntax" (volatile). Tạo portable core (4 files) làm source of truth, rồi generate platform-specific output qua thin adapters.

**Thay đổi lớn nhất**:
1. 22 SKILL.md → 1 WORKFLOW.md (organized by phases, not commands)
2. Level 1/2/3 (quality tiers) → `default_depth` + per-task AI routing (quality always max, ceremony adapts)
3. Blank templates → guided questionnaires with readiness scoring
4. Hook chỉ nhắc nhở → script thực sự chạy tests/lint
5. Config 130 dòng → ~40 dòng
6. Claude-only → Claude default + portable core cho mọi platform

**Yêu cầu review**: Đánh giá tính khả thi, phát hiện rủi ro chưa thấy, đề xuất cải thiện.

---

## 1. First Principles: Tại Sao Phải Thay Đổi?

### 1.1 Vấn đề cốt lõi

Bỏ hết implementation details. Developer làm việc với AI thực sự cần gì?

1. **Workflow để follow** — research trước code, plan trước execute, verify trước ship
2. **Guided decision support** — không phải blank templates, mà là structured questions với smart recommendations
3. **Layered quality assurance** — từ requirements rõ ràng đến TDD đến cross-review đến QA sign-off
4. **Measurable progress** — effort tracking, velocity, estimate vs actual
5. **Team continuity** — handoff, tracking, sprint-native collaboration

Tất cả những thứ khác — 22 SKILL.md riêng lẻ, `$ARGUMENTS`, `context: fork`, `allowed-tools`, `.claude/` directory — là **implementation detail của một platform tại một thời điểm**.

### 1.2 Rủi ro nếu không thay đổi

- Claude Code CLI thay đổi syntax → toàn bộ 22 skills cần rewrite
- Team muốn dùng Cursor (đang dùng!) → không thể
- AI models thông minh hơn → 22 files separate instructions trở nên redundant
- Context window lớn hơn → file-based context passing bớt cần thiết
- MCP standardize tool interaction → Claude-specific tool permissions lỗi thời

### 1.3 Phản biện đã thực hiện

**"Level 1/2/3 có ý nghĩa không?"**

Phân tích: Level system tạo ra false choice. Không ai MUỐN "Level 1 quality." Biến thực sự không phải "bao nhiêu chất lượng" mà là "bao nhiêu ceremony context yêu cầu."

→ **Quyết định**: Bỏ Level. Thay bằng `default_depth` (quick/standard/thorough) = ceremony preference, không phải quality tier. Per-task AI routing đề xuất depth phù hợp.

---

## 2. Kiến Trúc Đề Xuất

### 2.1 Nguyên tắc thiết kế

- **Portable Core**: 4 files markdown chứa toàn bộ methodology, zero platform syntax
- **Quality is constant, ceremony adapts**: Không có "quality levels," chỉ có depth phù hợp
- **Guided UX**: Mỗi phase có structured questions, readiness score, AI recommendations
- **Claude as default**: Claude CLI adapter là primary, nhưng core portable cho mọi tool
- **Roles = capabilities**: Team composition quyết định available phases, không phải manual config

### 2.2 Directory Structure

```
dw-kit/
├── core/                          # SOURCE OF TRUTH (platform-agnostic)
│   ├── WORKFLOW.md                # 6-phase workflow, per-task routing, guided questions
│   ├── THINKING.md                # Critical + systems + first principles thinking
│   ├── QUALITY.md                 # 4-layer quality strategy + review checklists
│   ├── ROLES.md                   # BA, TL, Dev, QC, PM definitions + authority
│   └── templates/
│       ├── vi/                    # Vietnamese (guided questionnaire format)
│       ├── en/                    # English
│       └── pr-template.md
│
├── config/
│   ├── dw.config.yml              # ~40 lines (was 130)
│   ├── config.schema.json         # Validation
│   └── presets/                   # solo-quick, small-team, enterprise
│
├── adapters/
│   ├── claude-cli/                # DEFAULT: generates .claude/ from core
│   ├── cursor/                    # Generates .cursor/ rules + 5-7 skills
│   └── generic/                   # Generates single AGENT.md for any tool
│
├── scripts/
│   ├── setup.sh                   # Platform detection + wizard
│   ├── dw-quality-check.sh        # REAL quality gate
│   └── dw-validate-config.py      # Config validation
│
├── tests/
│   └── smoke-test.sh              # Toolkit self-tests
│
├── docs/
└── examples/
```

### 2.3 Core Files Breakdown

**WORKFLOW.md** — thay thế 22 SKILL.md

6 phases: Initialize → Understand → Plan → Execute → Verify → Close
+ Standalone workflows: Debug, Reports
+ Meta: Config validation, Upgrade, Rollback, Archive

Mỗi phase có:
- Guided questions (không phải blank template)
- Readiness score (khi nào ready cho phase tiếp)
- Context Completion Protocol (AI pre-fill + developer confirm)
- Role variants (BA, TL, QC nếu team có)

**THINKING.md** — framework tư duy (đã proven, giữ nguyên + thêm First Principles)

**QUALITY.md** — 4-layer quality strategy:
1. Requirements Clarity (before coding): Given/When/Then, edge cases upfront
2. TDD (during coding): Red → Green → Refactor per subtask
3. Cross-Review (after coding): TL arch review + peer code review + A/B testing
4. QA Confirmation + Automated Gates (before merge): QA sign-off + dw-quality-check.sh

**ROLES.md** — role definitions với decision authority per phase

### 2.4 Config mới: `dw.config.yml`

```yaml
project:
  name: "my-project"
  language: "vi"

workflow:
  default_depth: "standard"   # quick | standard | thorough
  # AI assesses per-task and may recommend different depth

team:
  roles: [dev, techlead]      # Roles = available capabilities

quality:
  test_command: ""            # empty = skip, set = run
  lint_command: ""
  block_on_fail: false

tracking:
  estimation: false
  log_work: false
  estimation_unit: "hours"

paths:
  tasks: ".dw/tasks"
  docs: ".dw/docs"
```

**Thay đổi so với v0.3:**
- `level: 2` → `default_depth: "standard"` (ceremony, không phải quality)
- 17 flags riêng lẻ → depth defaults + role-based availability
- `pre_commit_tests: true/false` → `test_command: "npm test"` (rõ nghĩa hơn)
- Sensitive data scan luôn bật (non-configurable safety)
- 130 dòng → ~40 dòng

### 2.5 Depth + Roles Matrix

| Phase | Quick | Standard | Thorough | Requires |
|---|---|---|---|---|
| Research | always | always | always | dev |
| Plan | skip | ON | ON | dev |
| Arch Review | skip | if TL present | ON | techlead |
| Estimation | skip | optional | ON | dev |
| Test Plan | skip | skip | ON | qc |
| Execute TDD | always | always | always | dev |
| Log Work | skip | optional | ON | dev |
| Code Review | self-review | ON | ON | dev + peer/TL |
| QA Confirm | skip | skip | ON | qc |
| Living Docs | skip | skip | ON | dev |
| Dashboard | skip | skip | ON | pm |

Solo dev với `thorough` vẫn hoạt động — phases yêu cầu roles vắng mặt gracefully degrade.

---

## 3. Adapter System

### 3.1 Claude CLI (DEFAULT)

Generates `.claude/` structure từ core:
- 22 SKILL.md backward compatible (generated, không hand-maintained)
- Agent files với least-privilege constraints
- Hook scripts gọi `dw-quality-check.sh`
- `settings.json` với permission allowlists

### 3.2 Generic

Generates 1 file `AGENT.md` cho bất kỳ AI tool:
- Combine WORKFLOW.md + THINKING.md summary + config reference
- Zero platform syntax
- Drop vào project = instant workflow

### 3.3 Cursor

Generates `.cursor/` structure:
- Rules files từ core
- 5-7 consolidated skills (thay vì 22):
  - `/dw-task` — full workflow
  - `/dw-debug` — standalone debug
  - `/dw-review` — code review
  - `/dw-commit` — smart commit
  - `/dw-report` — dashboard/sprint
  - `/dw-help` — skill discovery
  - `/dw-thinking` — thinking framework

---

## 4. Guided Decision Support: Context Completion Protocol

**Concept**: Khi context thiếu, AI không dừng lại chờ. Nó:
1. Phát hiện gaps (questions chưa trả lời)
2. Phân tích codebase để pre-fill answers
3. Trình bày cho developer: "Tôi tìm được những điều này. Xác nhận hoặc sửa?"
4. Developer confirm/correct
5. Readiness score update → proceed khi đủ

**Ví dụ:**
```
AI phát hiện: task-context.md có 3/8 questions đã trả lời
  → AI phân tích codebase, pre-fill 4 câu nữa:
    1. Modules liên quan: auth/, users/, middleware/ [confirm?]
    2. Patterns hiện tại: Repository pattern với DI [confirm?]
    3. Dependencies: auth → jwt, users → db [confirm?]
    4. Test coverage: 65% trên auth module [confirm?]
  → Developer confirms/corrects
  → Readiness: 7/8 → tiến hành Plan
```

---

## 5. Quality Strategy: 4 Layers

### Layer 1: Requirements Clarity (trước khi code)
- Business logic với Given/When/Then
- Edge cases identified upfront
- TL review requirements trước khi dev bắt đầu
- Acceptance criteria per subtask (testable, specific)

### Layer 2: Test-Driven Development (trong khi code)
- Tests viết TRƯỚC implementation
- Red → Green → Refactor per subtask
- Regression suite maintained

### Layer 3: Cross-Review + A/B Testing (sau khi code)
- TL review architecture decisions
- Peer code review với structured checklist
- Với quyết định uncertain: prototype 2 approaches, compare, TL decides
- Decisions logged trong task docs

### Layer 4: QA Confirmation + Automated Gates (trước merge)
- QA reviews against test plan
- QA sign-off as explicit gate
- `dw-quality-check.sh` thực sự chạy tests/lint/scan (không chỉ nhắc nhở)

---

## 6. Agile Team Tracking

### Sprint-Native Progress
- Progress format bao gồm: sprint ID, velocity data
- Handoff là first-class operation
- Progress file doubles as team communication artifact

### Effort Tracking Loop
```
Estimate (Phase 3) → Log Actual (Phase 4) → Compare (Phase 6)
  → Feed into velocity → Improve future estimates
```

### Handoff Protocol
1. Auto-summarize: done / in-progress / blocked
2. Git state snapshot: uncommitted, stash, recent commits
3. Next steps: ordered action list
4. Context anchors: key decisions and why

---

## 7. Migration Strategy

**Nguyên tắc**: Non-breaking. Core/ tồn tại song song .claude/. Không gì bị break.

### Phase A: Build Core
1. `core/WORKFLOW.md` — consolidate 22 skills thành 6 guided phases
2. `core/THINKING.md` — move + add First Principles section
3. `core/QUALITY.md` — 4-layer quality strategy
4. `core/ROLES.md` — role definitions
5. `core/templates/` — redesign thành guided questionnaires

### Phase B: Config & Scripts
6. `config/dw.config.yml` — simplified, depth + roles
7. `config/config.schema.json` — validation
8. `scripts/dw-quality-check.sh` — real enforcement

### Phase C: Adapters
9. Claude CLI adapter (DEFAULT)
10. Generic adapter (AGENT.md)
11. Cursor adapter

### Phase D: Integration
12. Refactor setup.sh
13. Smoke tests
14. Update docs

---

## 8. What Changes (Summary Table)

| Current (v0.3) | Proposed (v2) | Why |
|---|---|---|
| 22 SKILL.md files | Sections in WORKFLOW.md | One document, no platform syntax |
| 4 agent .md files | Adapter-generated | Agent isolation is platform detail |
| `$ARGUMENTS`, `context: fork` | Generic "task input" | Platform syntax eliminated |
| Blank template forms | Guided questionnaires + readiness scores | Elite UX |
| `dv-workflow.config.yml` (130 lines) | `dw.config.yml` (~40 lines) | Roles + depth, simpler |
| Level 1/2/3 (quality tiers) | `default_depth` + per-task AI routing | Quality always max |
| 17 individual flags | Depth defaults + role-based availability | Less to misconfigure |
| Hook chỉ nhắc nhở | `dw-quality-check.sh` thực sự chạy | Fulfill quality promise |
| quality-checker agent (orphaned) | Integrated into script | Dead code eliminated |
| Không có effort loop | Estimate → Log → Compare → Velocity | Quantification |
| Không có QA gate | QA sign-off in Phase 5 | Quality layer 4 |
| Không có A/B testing | Decision support in Phase 3 | Better decisions |

---

## 9. Naming Convention

| Before | After | Note |
|---|---|---|
| `dv-workflow.config.yml` | `dw.config.yml` | Shorter |
| `dv-workflow-kit` | `dw-kit` | Brand stays, daily use is `dw` |
| `/dw-plan`, `/dw-research`... | `/dw-task`, `/dw-debug`... | 22 → 5-7 consolidated |
| `.dv-workflow/` | `.dw-kit/` or `.dw/` | Consistent prefix |

---

## 10. Risk Assessment

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| WORKFLOW.md quá dài | Medium | Medium | Table of contents, config-driven skip |
| Guided questions cảm thấy restrictive | Medium | Medium | Là guidance, không phải gate. Quick depth skip hầu hết |
| Adapter generation bỏ sót nuances | Medium | High | So sánh generated vs hand-maintained. Smoke tests. |
| Claude CLI thay đổi syntax | High | High | Core platform-agnostic. Chỉ adapter cần update. (Key win.) |
| Effort tracking thêm overhead | Low | Medium | Optional via config. Quick/standard có thể disable |
| Over-engineering adapter system | Medium | Medium | Bắt đầu với Claude adapter. Thêm others on demand. |

---

## 11. Câu Hỏi Cho Reviewer

1. **Core size**: 4 core files (WORKFLOW + THINKING + QUALITY + ROLES) có đủ, hay cần tách thêm/gom bớt?
2. **Adapter complexity**: Generate .claude/ từ WORKFLOW.md có feasible không? Hay nên duy trì parallel (core + hand-maintained .claude/)?
3. **Per-task routing**: AI tự assess scope/risk/familiarity và recommend depth — liệu LLM hiện tại có đủ reliable để làm việc này?
4. **Context Completion Protocol**: AI pre-fill answers rồi developer confirm — flow này có thực tế trong CLI environment không?
5. **Breaking changes**: Migration strategy đủ an toàn chưa? Có scenario nào v0.3 users bị ảnh hưởng?
6. **Naming**: Đổi từ `dv-workflow` sang `dw` — có gì cần xem xét thêm?
7. **Missing risks**: Có rủi ro nào chưa được identify?

---

## 12. Implementation Todos

| # | Task | Phase | Effort Est. |
|---|---|---|---|
| 1 | Create `core/WORKFLOW.md` (consolidate 22 skills, guided questions) | A | 8h |
| 2 | Move + enhance `core/THINKING.md` | A | 2h |
| 3 | Create `core/QUALITY.md` (4-layer strategy) | A | 3h |
| 4 | Create `core/ROLES.md` | A | 2h |
| 5 | Redesign `core/templates/` as questionnaires | A | 3h |
| 6 | Create `config/dw.config.yml` + schema + presets | B | 3h |
| 7 | Create `scripts/dw-quality-check.sh` | B | 3h |
| 8 | Create Claude CLI adapter (DEFAULT) | C | 6h |
| 9 | Create generic adapter (AGENT.md) | C | 3h |
| 10 | Create Cursor adapter | C | 4h |
| 11 | Create `tests/smoke-test.sh` | D | 3h |
| 12 | Refactor `setup.sh` | D | 3h |
| 13 | Update docs, README, CHANGELOG | D | 4h |
| **Total** | | | **~47h** |

---

> **Yêu cầu review**: Đọc toàn bộ plan, đối chiếu với codebase hiện tại (`dv-workflow.config.yml`, `.claude/skills/`, `CLAUDE.md`), và trả lời 7 câu hỏi ở Section 11. Phát hiện rủi ro, logical gaps, hoặc over-engineering. Đề xuất cải thiện cụ thể.
>
> **Context cần đọc trước review**: `docs/toolkit-evaluation-report-20260318.md`, `docs/upgrade-plan.md`, `CHANGELOG.md`, `dv-workflow.config.yml`

---

*Plan created by Cursor AI Agent — 2026-03-23*
*Methodology: First Principles + Critical Thinking + Systems Thinking + Multi-Perspective*
