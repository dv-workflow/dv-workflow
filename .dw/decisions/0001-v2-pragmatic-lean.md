---
id: ADR-0001
title: dw-kit v2.0 Direction — Pragmatic Lean, Context-First Governance
status: Proposed
date: 2026-04-21
deciders: huydv
impact: major
supersedes: null
superseded-by: null
---

# ADR-0001: dw-kit v2.0 Direction — Pragmatic Lean, Context-First Governance

**TL;DR:** Cut ~50% surface area qua 3 releases (v1.3 → v1.4 → v2.0), telemetry-driven cuts, 5-pillar architecture. **Framing inversion:** từ prescriptive workflow toolkit → descriptive governance layer. AI tự drive execution; dw-kit provides guards/surfaces/records/bridges/tunes.

---

## Context

dw-kit hiện tại ở v1.2.1 đã tích lũy:
- **Baseline measured 2026-04-21:** 61 files trong `.claude/`, 55 files trong `.dw/` (total 116)
- **Rules injection:** 11,322 bytes across 5 files (`.claude/rules/` + `CLAUDE.md`)
- **Hooks:** 8 (scout-block, privacy-block, session-init, pre-commit-gate, safety-guard, post-write, stop-check, progress-ping)
- **Skills:** 29 slash commands
- **Task docs:** 3-file system mandatory (context + plan + progress)

TechLead và 2 dev teams (~10 devs) feedback:
1. Quá nhiều permission prompts (hooks trigger liên tục)
2. Quá nhiều bước trong workflows
3. Token footprint lớn
4. Rườm rà trong dùng hàng ngày

**Framing inversion (strategic reframe):**
v1.x **prescribes** workflow (dùng skill X trước Y, viết 3 files). v2.0 **describes** governance (đây là decisions, đây là context, đây là safety boundaries — AI tự drive, human audit).

Moat của v2.0 là **organizational memory compounding over time** — IDE tools (Cursor, Copilot) structurally không own được vì bị giới hạn ở session scope.

**Forces:**
- Maintain existing users (2 teams × ~10 devs đã dùng v1.x)
- Reduce friction (confirmed)
- Compete với IDE-native tools
- Serve dual audience (team + solo OSS)
- Design for AI capability evolution

## Options Considered

### Option A: Conservative Refresh (rejected)
Compress templates, merge rules, giữ nguyên architecture. Cut ~20%.
- **Pros:** Zero breaking; low risk
- **Cons:** Không giải quyết pain points; không differentiate
- **Rejected because:** *"20% cut không differentiate khỏi commoditization path."*

### Option B: Radical Rewrite (rejected)
Cut 70%: 3 hooks, 7 skills, 1-file tasks, 1 rules file.
- **Pros:** Lean thật; clear identity
- **Cons:** Breaking lớn; phá trust 2 teams; rủi ro cut nhầm
- **Rejected because:** *"No telemetry evidence → gut-feel cuts recreate Option B risk."*

### Option C: Pragmatic Lean + Telemetry-Driven (CHOSEN)
Cut ~50% với data backing qua 3 releases. 5-pillar architecture.
- **Pros:** Data-driven; incremental trust; dogfood opportunity; escape hatches
- **Cons:** Timeline 3.5-4 tháng; cần discipline Won't Contain

## Decision

**Chọn Option C: Pragmatic Lean + Telemetry-Driven với 5-pillar architecture.**

**Kiến trúc v2.0 (verb-based pillars):**

| Pillar | Verb | Role | Examples |
|--------|------|------|----------|
| 1. **Guards** | Block unsafe | Non-negotiable safety | privacy-block, pre-commit-gate |
| 2. **Surfaces** | Make state visible | Context/conventions | project-map, ACTIVE.md, modules |
| 3. **Records** | Capture why | Decision trail | ADRs, decision history |
| 4. **Bridges** | Connect across time | Session continuity | auto-handoff, living docs, tracking |
| 5. **Tunes** | Behavioral knobs | Config & presets | roles, depth, team/solo presets |

**Task docs format v2.0 (2-file, dogfood từ v1.3):**
```
.dw/tasks/{task-name}/
├── spec.md      # Intent + plan (stable after approve)
└── tracking.md  # Progress + handoff (mutable)
```

**Telemetry schema (events.jsonl, append-only, local-only):**
```jsonl
{"ts":"2026-04-21T10:30:00Z","event":"skill","name":"dw-commit","session":"<hash>","depth":"quick"}
{"ts":"2026-04-21T10:30:05Z","event":"hook","name":"pre-commit-gate","result":"pass","latency_ms":120}
{"ts":"2026-04-21T10:32:00Z","event":"task","action":"created","name":"x","depth":"standard"}
```

**Cut Criteria Matrix (v1.4 decisions):**

| Feature Type | Cut Criteria |
|--------------|--------------|
| Skill | `uses_per_week_per_dev < 5` AND `not_critical_path` AND `n_devs >= 5` AND `coverage_days >= 21` |
| Hook | `average_latency_ms > 500` OR (`fires_per_session > 10` AND `user_value < signal_threshold`) |
| Rules file | `tokens_loaded > 500` AND `referenced_in_session < 10%` |
| Exception | Per-project skills (`/dw-onboard`, `/dw-retroactive`) evaluated separately |

**Won't Contain List (authoritative — overrides Spec if conflict):**
- scout-block hook
- post-write hook
- progress-ping hook
- session-init hook (replace bằng ACTIVE.md + CLAUDE.md reference)
- `/dw-research`, `/dw-plan`, `/dw-execute` as prescriptive skills (convert thành context injectors)
- 3-file task docs as default
- Split rules files (merge thành 1-2)
- Network telemetry (chỉ local)
- Automated doc editing (chỉ suggest)
- JIRA/Linear integration
- Dashboard web UI (CLI only)
- AI auto-write ADRs

**Assumptions & Invalidation Triggers:**

| Assumption | Trigger to reopen ADR |
|------------|----------------------|
| Claude Code hooks API stable 3 tháng | Anthropic release breaking change → emergency patch + pause v1.4 |
| Telemetry đủ signal với n≥5 devs, ≥21 days | Nếu n<5 hoặc <5 events/day/user sau 4 tuần → fallback criteria |
| 2 internal teams chấp nhận dogfood v1.3 | Nếu >2 devs opt-out trong tuần 1 → pause, office hours |
| AGENTS.md standard không emerge | Nếu widely adopted → pivot CONTEXT pillar to integration |
| Claude Code không ship native task-tracking | Nếu ship → pivot BRIDGES pillar |
| 3→2 file consolidation là net positive (intuition-based, NOT evidence-backed) | Nếu sau 4 tuần v1.3: (a) avg `tracking.md` >400 dòng, OR (b) >50% dev báo không có chỗ ghi research findings, OR (c) >30% task có ≥3 files (tự add back) → reopen, cân nhắc Option C (+ optional `research.md`) hoặc Option D (depth-driven structure) |

**Success Criteria (operationalized):**

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | Auto-loaded context bytes giảm ≥50% | Measure total bytes of all auto-loaded files (rules + CLAUDE.md + hook outputs). Baseline: 11,322+ |
| 2 | File count giảm ≥40% | `find .claude .dw -type f \| wc -l` vs baseline 116 |
| 3 | Dev friction survey Δ ≥ +2 (NPS-style 1-10) | Before/after survey, n≥8 (80% of 10 devs), question: "Rate dw-kit friction" |
| 4 | New user first productive session <5 min | Fresh install → successful `/dw-commit` or equivalent. Measured via installer script timing. |
| 5 | Zero skill kept without cut-criteria-matrix evidence | Every kept skill has telemetry row showing ≥5 uses/week/dev OR critical-path exemption documented |

**Qualified as v2.0 when ≥4/5 met.** If 3/5 → v2.0-rc (release candidate, iterate). If ≤2 → reopen ADR.

**Commitment Signals (time-box):**
- v1.3 ship by **2026-05-12** (3 weeks) OR reopen ADR
- v1.4 ship by **2026-06-30** (telemetry + cuts) OR reopen ADR
- v2.0 ship by **2026-08-15** (polish + comms) OR reopen ADR

## Consequences

**Positive:**
- Clear strategic identity: "Context-First SDLC Governance Layer"
- Unique moat (Records + Bridges pillars không duplicate được bởi IDE tools)
- Data-driven cuts → defensible decisions
- Dogfooding từ v1.3 → early feedback loop
- Solo preset opens new market
- Descriptive framing scales with AI capability (prescriptive doesn't)

**Negative (trade-offs chấp nhận):**
- Timeline 3.5-4 months
- Telemetry privacy cần handle kỹ
- Breaking changes ở v2.0 → migration guide mandatory
- Scope creep risk cao — Won't Contain list là defense
- Opt-in telemetry → mandatory cho internal teams để tránh n=1

**Neutral:**
- Pillars stable; features trong pillar cut/add
- OSS adoption slow trong transition

## Cost Estimate

~80-120 engineering hours over 3.5-4 months (1 solo maintainer, part-time).

## Rollback Plan

| Trigger | Action |
|---------|--------|
| v1.3 break 2 teams (>2 devs report broken workflow) | Revert via `npm install dw-kit@1.2.1` + hotfix patch |
| Telemetry < threshold sau 4 tuần | Fall back to qualitative survey; delay v1.4 |
| Anthropic hook API breaking change | Emergency v1.2.2 patch; pause roadmap |
| v2.0 success criteria < 3/5 | Ship as v2.0-rc, iterate; reopen ADR-0001 |

## References

- Brainstorm task: `.dw/tasks/dw-kit-v2-strategy/` (red/blue debate round 1-2)
- Implementation task: `.dw/tasks/dw-kit-v2-lean-optimization/`
- Previous debates: 2026-04-20 (claude-opus-4-7)
