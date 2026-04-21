---
task_id: dw-kit-v2-lean-optimization
created: 2026-04-21
status: Spec Approved for v1.3 Execution
owner: huydv
depth: thorough
related_adr: ADR-0001
target_ship: 2026-05-12 (v1.3) / 2026-06-30 (v1.4) / 2026-08-15 (v2.0)
---

# Spec: dw-kit v2.0 Lean Optimization

## Intent

Chuyển dw-kit từ **prescriptive Workflow Engine** → **descriptive Context-First Governance Layer** qua 3 releases, cut ~50% surface area với data-driven decisions.

## Why Now

- Pain points confirmed: ~10 devs × 2 teams
- AI tooling evolving nhanh — pivot trước khi commoditize
- v1.2.1 stable — cơ hội refactor
- Dogfood opportunity: plan v2.0 bằng chính dw-kit v1.x

## Scope

### Phase 1 — v1.3 Foundation (ship target: 2026-05-12, ~3 weeks)

Priority order (sorted by value × low-effort, recommended by blue-bot):

**ST-1.1: Archive Done tasks** ✅ COMPLETED 2026-04-21
- 8 tasks moved to `.dw/tasks/archive/`
- Acceptance: `.dw/tasks/` chỉ còn active tasks ✅

**ST-1.2: Baseline measurement** ✅ COMPLETED 2026-04-21
- File: `baseline.md` (in this task folder)
- Acceptance: Numeric baseline committed ✅

**ST-1.5: Decisions layer scaffold** ← START HERE
- ✅ `.dw/decisions/_template.md` created
- ✅ ADR-0001 written (dogfood)
- TODO: `/dw-decision` skill stub (lightweight, defer full wizard to v1.4)
- Acceptance: ADR format usable; anyone can create ADR-0002+ following pattern

**ST-1.3: New task docs format (spec + tracking)**
- Create `.dw/core/templates/v2/spec.md` and `tracking.md` templates
- Update CLAUDE.md guidance (mention new format)
- Legacy 3-file still works (backward compat via fallback read)
- Acceptance: New tasks use 2-file format; old tasks readable
- Effort: 2-3 days

**ST-1.4: ACTIVE.md auto-index**
- Script generates `.dw/tasks/ACTIVE.md` with 1 line per active task
- Format: `{task-name} · {status} · {last-touched} · {blockers}`
- Example: `dw-kit-v2-lean-optimization · execute · 2026-04-21 · none`
- Trigger: Stop hook + session-init (until replaced)
- Cross-platform safe (Windows/Linux line endings)
- Acceptance: File auto-updates; no manual editing needed
- Effort: 1-2 days

**ST-1.8: Migration guide (MIGRATION-v1.3.md)**
- Written incrementally — every user-visible change adds a section
- Must cover: task format, decisions layer, telemetry disclosure
- Acceptance: Every ST-1.x has migration note
- Effort: <1 day (written alongside other STs)

**ST-1.6: Telemetry (local-only) — HIGHEST VALUE, SHIP LAST OF v1.3**
- Schema: `{ts, event, name, session_hash, depth?, result?, latency_ms?}`
- Storage: `.dw/metrics/events.jsonl` append-only
- Log events: skill invocations, hook fires, task lifecycle
- New CLI: `dw metrics show [--since=DATE] [--skill=NAME]`
- Privacy: local-only default; zero network; `DW_NO_TELEMETRY=1` env kill-switch
- **Mandatory for internal 2 teams** (policy, not opt-in)
- Opt-in public sharing: `dw metrics share --anonymize` (defer impl to v1.4)
- Acceptance: Events logged; command shows data; env kill-switch works
- Effort: 3-5 days

**ST-1.7: Solo preset scaffold**
- `dw init --solo` flag
- Preset: Guards hooks only (privacy-block, pre-commit-gate); task_docs disabled; zero prompts
- Acceptance: `npx dw-kit init --solo` → working setup <30s
- Effort: 1-2 days

**ST-1.9: Skill naming convention — `/dw-{name}` → `/dw:{name}`**
- Rationale: Namespace separator `:` cleaner than `-` prefix; matches convention in many tools (git:log, etc.); distinguishes dw skills from other skills visually
- Change: SKILL.md frontmatter `name:` field only (directory names stay as-is for Windows compat — `:` illegal in filenames)
- Example: `name: dw-thinking` → `name: dw:thinking` (folder remains `.claude/skills/dw-thinking/`)
- **Pre-check required:** Verify Claude Code accepts `:` in skill `name:` field before mass rename. If unsupported → fallback to `dw.thinking` or abort this ST.
- Scope: All 29 skills + update docs (CLAUDE.md, `.claude/rules/dw-skills.md`, README, migration guide)
- Breaking: Slash command invocation changes for all users → MUST have migration note
- Backward compat option: Emit deprecation warning when `/dw-xxx` invoked (redirect to `/dw:xxx`) — if harness supports
- Acceptance: 29 skills renamed; docs updated; smoke test passes; migration guide section added
- Effort: 1-2 days (mostly mechanical find-replace + verification)

**v1.2.2 Momentum Patch (optional, blue-bot suggestion):**
- Ship ST-1.1 + ST-1.2 + ST-1.5 as early patch within week 1
- Signal to 2 teams + contributors: v2.0 work has begun
- Low risk, high visibility

### Phase 2 — v1.4 Data-Driven Cuts (ship target: 2026-06-30)

**Prerequisite:** ≥4 tuần telemetry from v1.3, n_devs ≥ 5, coverage_days ≥ 21.

Apply Cut Criteria Matrix (from ADR-0001):

**ST-2.1: Cut hooks passing criteria**
- Candidates (ADR Won't Contain): scout-block, post-write, progress-ping
- Validate with telemetry before cut
- Emit ADR-0002+ for each cut ("Remove {hook-name}")

**ST-2.2: Cut skills passing criteria**
- Candidates: TBD based on telemetry (no guessing)
- Emit ADR per cut

**ST-2.3: Rules file consolidation**
- 5 files → 1-2 files
- Target: ≥50% byte reduction
- Measured via auto-loaded context bytes metric

**ST-2.4: `/dw-decision` full wizard**
- Beyond v1.3 stub: enquirer flow for context/options/decision/consequences
- Auto-number ADR
- Link to related tasks

**ST-2.5: Auto-handoff on Stop hook**
- Stop hook detects uncommitted changes + active task
- Auto-append summary to `tracking.md`
- No LLM call (keep fast); template-based

**ST-2.6: Living docs post-write detection — HARD SCOPE**
- **Scope cap (explicit):** Only flag mismatch between `docs/*.md` API mentions and code symbol changes
- **Not in scope:** LLM-powered auto-update; cross-file semantic analysis; auto-commit
- Implementation: regex-based symbol tracking; suggest only
- If scope grows > 1 week effort → defer to v2.1

### Phase 3 — v2.0 Unified Release (ship target: 2026-08-15)

**ST-3.1: Full 5-pillar architecture consolidation**
**ST-3.2: Skills → context injectors**
- Clarify: Skills no longer prescribe steps; skills inject relevant context into prompt; Claude chooses approach
- Apply to: `/dw-research`, `/dw-plan`, `/dw-execute`
**ST-3.3: Dashboard reads real metrics**
- `dw dashboard` command (CLI only, not web UI)
- Shows: velocity, skill usage distribution, hook latency, cut candidates
**ST-3.4: OSS launch communications**
- Blog post (~500 words)
- GitHub README với 5-pillar diagram
- Office hours 1h cho 2 internal teams

### Out of Scope (Won't Contain — mirrors ADR-0001)

See ADR-0001 Won't Contain List (authoritative source).

## Timeline (Realistic, adjusted from red-bot feedback)

| Phase | Duration | Ship Target | Cost |
|-------|----------|-------------|------|
| v1.3 Foundation | 3 weeks | 2026-05-12 | ~20-30h |
| Telemetry collection | 4 weeks (parallel use) | — | Passive |
| v1.4 Cuts | 3-4 weeks | 2026-06-30 | ~30-40h |
| v2.0 Polish | 3 weeks | 2026-08-15 | ~20-30h |
| **Total** | **~4 months** | | **~80-120h** |

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Scope creep — v1.3 bloats | High | Won't Contain List (ADR-0001); `v1.2.2` momentum ship |
| Breaking changes hurt adoption | High | v1.3 fully backward compat; v2.0 migration guide; `dw-kit@1` on npm |
| Telemetry privacy backlash | Medium | Local-only default; `DW_NO_TELEMETRY=1` kill-switch; transparent inspection |
| Cut feature users actually need | Medium | 4-week min telemetry; `legacy_features: true` escape hatch; ADR per cut |
| Dogfood reveals architecture flaw | Low | Mid-course correction window (end of each phase) |
| 2 internal teams resist | Medium | Heads-up message week 1; office hours; v1.x available |
| Telemetry n=1 bias | **HIGH** | **Mandatory internal collection** (not opt-in for 2 teams); min n_devs ≥ 5 gate |
| Anthropic hook API breaking | Medium | Emergency v1.2.2 patch; pause roadmap; monitor Claude Code changelog weekly |

## Success Criteria (operationalized — see ADR-0001)

Hard metrics (≥4/5 = v2.0 qualified; 3/5 = v2.0-rc; ≤2 = reopen ADR):

- [ ] Auto-loaded context bytes ≥50% reduction (baseline: 11,322+ bytes)
- [ ] File count ≥40% reduction (baseline: 116 files)
- [ ] Dev friction NPS survey Δ ≥ +2 (n≥8, scale 1-10)
- [ ] New user first productive session <5 min (fresh install → `/dw-commit` success)
- [ ] Zero skill kept without cut-criteria-matrix evidence

## Dogfood Metrics (new — blue-bot suggestion)

Track during v1.3 execution:
- Number of ADRs written (target: ≥3 by end of v1.3)
- Pain points logged in `tracking.md` (target: ≥5)
- Telemetry events self-generated by maintainer (pre-ST-1.6: manual log)
- Friction journal entries in `friction-log.md` (open-ended)

## Communication Plan (lightweight)

| Touchpoint | Timing | Effort | Channel |
|------------|--------|--------|---------|
| Heads-up | v1.3 ship | 1h | Slack/email to 2 teams + link ADR-0001 + MIGRATION-v1.3.md |
| Data Day | v1.4 ship | 2h | `.dw/decisions/` summary + release notes |
| Positioning Shift | v2.0 launch | 1 day | Blog post + README + office hours 1h |

`CHANGELOG.md` maintained religiously throughout (1 line per change).

## Dependencies

- Claude Code hooks API stability (see ADR-0001 Assumptions)
- npm registry (publish pipeline)
- GitHub Issues (OSS feedback loop)

## Known Unknowns (admitted gaps)

1. "Context injector" skill pattern — exact interface TBD in v2.0 design
2. Telemetry schema v2 — will evolve as we discover needs
3. Dogfood reveals — may force plan adjustment mid-phase
4. AGENTS.md standard — may emerge and require integration pivot
5. Living docs scope boundary — must stay tight

## Acceptance (Task Complete When)

- [x] ADR-0001 approved
- [ ] v1.3 shipped to npm with backward compat by 2026-05-12
- [ ] v1.4 shipped with data-backed cuts by 2026-06-30
- [ ] v2.0 shipped with success criteria ≥4/5 by 2026-08-15
- [ ] Migration guide published
- [ ] 2 internal teams migrated successfully
- [ ] `friction-log.md` has ≥5 entries
- [ ] ≥3 ADRs written beyond ADR-0001
