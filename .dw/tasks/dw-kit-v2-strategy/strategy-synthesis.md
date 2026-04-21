# Synthesis: dw-kit v2.0 Strategic Direction

## Ngày: 2026-04-20
## Trạng thái: Draft — chờ TechLead confirm
## Input: Red-bot attack + Blue-bot defense (claude-opus-4-7)

---

## Convergence Point — Cả Hai Bot Đều Chỉ Về Cùng Một Hướng

Red-bot nói: *"dw-kit nên build governance/observability layer — Cursor/Copilot không làm được."*
Blue-bot nói: *"`.dw/decisions/` ADR layer là unique moat — nobody does this well."*

Đây là cùng một insight từ 2 góc: **dw-kit's real moat là institutional knowledge capture — thứ IDE tools structurally không thể làm vì họ bị giới hạn ở session scope.**

---

## Strategic Pivot

```
v1.x:     dw-kit = Workflow Engine
Proposed: dw-kit = Context-First SDLC Governance Layer

Core pillars:
  1. SAFETY     — hooks (privacy-block, pre-commit-gate) — non-negotiable
  2. CONTEXT    — project-map, modules, conventions
  3. DECISIONS  — ADR layer (NEW) — unique moat
  4. CONFIG     — roles, depth routing, quality commands
```

**Không còn trong core:**
- Workflow scripts (skills trở thành lightweight context triggers)
- Mandatory 3-file task docs (optional, chỉ enforce ở `thorough`)
- Scout-block hook (replace bằng permission allowlist tĩnh)
- Verbose rules injection (compress, reference thay vì inline)

---

## Quyết Định Đã Resolved

| Decision | Kết quả | Lý do |
|----------|---------|-------|
| D1: Build strategy | **Incremental** | Users thật đang dùng v1.x; clean slate break trust; test giả định trên user thật |
| D2: Task docs | **Optional, single progress.md** | 3-file overhead cao; opt-in cho `quick`/`standard`; mandatory chỉ `thorough` |
| D3: Skills | **Context injectors** | Workflow scripts sẽ bị AI replace; context là permanent value |
| D4: Decisions layer | **Build — pillar thứ 3** | Unique moat; obsolescence-proof; serve cả AI lẫn human |

---

## Decisions Layer — Spec Draft

```
.dw/decisions/
├── ADR-0001-[title].md
├── ADR-0002-[title].md
└── _template.md
```

**Format mỗi ADR:**
- Context: tại sao quyết định này cần được đưa ra
- Options considered: ≥2 phương án đã xem xét
- Decision: đã chọn gì
- Consequences: trade-offs chấp nhận
- Status: Proposed | Accepted | Deprecated | Superseded

**AI integration:**
- `/dw-decision [title]` — wizard tạo ADR mới
- Auto-inject ADR liên quan khi task touches module
- Pre-commit hook: detect architectural change → suggest `/dw-decision`

---

## Dual Audience — Resolved

Red-bot cảnh báo: dual audience = maintenance x2 + cả hai bị compromise.
Blue-bot counter: same core, chỉ khác defaults.

**Resolution:** Shared core, distinct defaults. Solo preset KHÔNG phải "team cắt xén":

```yaml
# Preset "solo":
workflow:
  default_depth: quick
  task_docs: false
flags:
  estimate: false
  log_work: false
  living_docs: false
hooks:
  scout_block: false       # replace bằng allowlist
  session_init: false      # zero ceremony
  privacy_block: true      # NON-NEGOTIABLE
  pre_commit_gate: true    # NON-NEGOTIABLE

# Preset "team":
workflow:
  default_depth: standard
  task_docs: true           # optional nhưng encouraged
flags:
  estimate: true
  log_work: true
hooks:
  # tất cả bật
```

Solo install: `npx dw-kit init --solo` — 10 giây, zero config.

---

## "Design for Obsolescence" — Resolved

Red-bot: self-defeating. Blue-bot: quality filter.

**Resolution:** Không phải "design để chết" mà là **"design để phần sống sót là phần giá trị nhất"**.

Test cần thêm chiều: *"Feature này có VALUABLE HƠN khi AI mạnh hơn không?"*

| Feature | AI mạnh hơn → | Verdict |
|---------|---------------|---------|
| Safety hooks | Vẫn cần (AI vẫn make mistakes) | KEEP |
| ADR decisions layer | Càng cần WHY context hơn | DOUBLE DOWN |
| Role system | Multi-agent orchestration cần roles | KEEP |
| Workflow scripts | AI tự làm tốt hơn | DEPRECATE |
| Task 3-file docs | AI memory improve → ít cần hơn | OPTIONAL |

---

## Observability Gap (từ Red-bot)

Điểm blind spot quan trọng: dw-kit hiện là write-only system. Cần:
- Audit trail khi AI output sai
- Metrics sau 6 tháng để justify tool
- Dashboard cho TechLead review patterns

**Resolution cho v2.0:** ADR layer + progress.md tạo nền tảng cho observability. `/dw-dashboard` skill đã tồn tại nhưng cần data. Đây là v2.1 scope, không phải v2.0.

---

## Roadmap Draft

```
v1.3 (next sprint):
  - Archive tất cả Done tasks
  - Compress rules injection (dw-core.md ngắn lại ~50%)
  - Replace scout-block bằng permission allowlist
  - Solo preset config option

v1.4:
  - decisions layer (ADR) — /dw-decision skill
  - Single progress.md thay 3-file cho quick/standard depth
  - Skills → context injectors (refactor 3-4 skills heavy nhất)

v2.0:
  - Full context-first harness
  - npm package nhẹ hơn đáng kể
  - Solo onboarding flow (npx dw-kit init --solo)
  - Team preset với decisions layer integrated
```

---

## Open Questions Còn Lại

1. **ADR auto-inject:** Làm sao detect "task touches module X" để inject ADR liên quan? Rule-based hay AI-driven?
2. **Solo viral hook:** Safety story marketing — cần real incident example để làm convincing
3. **Skills refactor priority:** Skills nào cần convert sang context injectors trước?
4. **Observability v2.1:** Metrics tracking cần data schema gì từ bây giờ để không phải retrofit?
5. **AGENTS.md standard:** Nếu cross-agent convention standard emerge, dw-kit có nên adopt không?

---

## Để Tiếp Tục

Đọc debate đầy đủ: `strategy-debate.md`
Context gốc: `strategy-context.md`
Approve roadmap → `/dw-task-init dw-kit-v1.3` để bắt đầu execute
