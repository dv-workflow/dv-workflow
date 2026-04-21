---
task_id: dw-kit-v2-lean-optimization
started: 2026-04-21
last_updated: 2026-04-21
status: v1.3.0 Verified Ship-Ready (audit passed)
current_phase: Final polish + ship preparation
blockers: none
---

# Tracking: dw-kit v2.0 Lean Optimization

## Status Snapshot

**Phase:** v1.3 Foundation
**Next milestone:** Ship v1.3 by 2026-05-12

## Subtask Progress

| # | Subtask | Status | Date | Notes |
|---|---------|--------|------|-------|
| ST-1.1 | Archive Done tasks | ✅ Done | 2026-04-21 | 8 tasks moved to `archive/` |
| ST-1.2 | Baseline measurement | ✅ Done | 2026-04-21 | See `baseline.md` |
| ST-1.5 | Decisions layer scaffold | ✅ Done | 2026-04-21 | ADR-0001 + ADR-0002 + `_template.md` + `/dw:decision` skill |
| ST-1.3 | New task docs format | ✅ Done | 2026-04-21 | Templates at `.dw/core/templates/v2/` (spec.md + tracking.md) |
| ST-1.4 | ACTIVE.md auto-index | ✅ Done | 2026-04-21 | `src/lib/active-index.mjs` + `dw active` CLI command |
| ST-1.8 | Migration guide | ✅ Done | 2026-04-21 | `MIGRATION-v1.3.md` comprehensive |
| ST-1.6 | Telemetry (local) | ✅ Done | 2026-04-21 | `src/lib/telemetry.mjs` + `dw metrics show` + `.claude/hooks/telemetry-log.sh` |
| ST-1.7 | Solo preset | ✅ Done | 2026-04-21 | `dw init --solo` + PRESETS["solo"] in init.mjs |
| ST-1.9 | Skill naming `dw-*` → `dw:*` | ✅ Done | 2026-04-21 | 30 skills renamed in `name:` field. TechLead verified `/dw:thinking` works → ADR-0002 status **Accepted**. |

## Changelog

### 2026-04-21 — Session: v2.0 strategy brainstorm + v1.3 foundation execution

**Actions taken:**
1. ✅ Captured baseline measurements (116 files, 11,322 bytes rules, 8 hooks, 29 skills)
2. ✅ Archived 8 Done tasks to `.dw/tasks/archive/`
3. ✅ Created `.dw/decisions/` directory + `_template.md`
4. ✅ Drafted ADR-0001 (v2.0 pragmatic lean direction)
5. ✅ Drafted this task's `spec.md` using new 2-file format (dogfood)
6. ✅ Ran red-bot + blue-bot (opus 4.7) adversarial verification on drafts
7. ✅ Incorporated feedback — rewrote ADR-0001 with:
   - YAML metadata header
   - TL;DR section
   - Verb-based pillar names (Guards/Surfaces/Records/Bridges/Tunes)
   - Telemetry schema inline
   - Cut Criteria Matrix
   - Invalidation triggers
   - Commitment signals with hard dates
   - Rollback plan
   - Framing inversion paragraph (prescriptive → descriptive)
8. ✅ Updated spec.md:
   - Realistic timeline (3.5-4 months, not 2-3)
   - Operationalized success criteria
   - Added mandatory internal telemetry
   - Scope cap for ST-2.6 (living docs)
   - Dogfood metrics section
   - Communication plan
   - Known unknowns admitted

**Decisions made:**
- Chose Option C (Pragmatic Lean + Telemetry-Driven) over A/B
- v1.3 ship target: 2026-05-12
- Execution order: ST-1.2 → ST-1.5 → ST-1.3 → ST-1.4 → ST-1.8 → ST-1.6 → ST-1.7
- Optional v1.2.2 momentum patch (archive + decisions scaffold)

**Pain points logged (friction journal seed):**
1. Writing 3-file task docs (context + plan + progress) for this task would waste time — spec.md + tracking.md enough
2. Invoking `/dw-research` then `/dw-plan` then `/dw-execute` as prescribed skills felt like following script vs reasoning
3. Session-init hook re-injecting same context each session = token waste if ACTIVE.md visible
4. 29 skills impossible to remember — need ≤10

### Next Session — TODO

- [ ] TechLead: verify `/dw:thinking` invocation works in Claude Code
  - If pass: update ADR-0002 status → Accepted; commit rename
  - If fail: revert rename (`sed -i 's/^name: dw:/name: dw-/' .claude/skills/dw-*/SKILL.md`); mark ADR-0002 Rejected
- [ ] Smoke test with new CLI commands: `dw active`, `dw metrics show`, `dw init --solo`
- [ ] Update `.claude/settings.json` to wire hooks → telemetry-log.sh (defer to v1.4)
- [ ] Commit all v1.3 changes with proper message
- [ ] Bump package.json to 1.3.0
- [ ] Draft release notes pulling from MIGRATION-v1.3.md
- [ ] Ship v1.3 to npm (target: 2026-05-12)

### Session 2 — v1.3 Foundation Code Complete (2026-04-21 afternoon)

**Actions taken (all 8 STs code-complete):**

ST-1.3: Created v2 task templates
- `.dw/core/templates/v2/spec.md`
- `.dw/core/templates/v2/tracking.md`
- Both with YAML frontmatter, friction journal, debate log slots

ST-1.4: ACTIVE.md auto-index
- `src/lib/active-index.mjs` — reads v1 and v2 format task folders, parses frontmatter
- CLI: `dw active` regenerates
- Smoke tested: correctly read current tracking.md frontmatter

ST-1.5: Decisions layer
- `.dw/decisions/_template.md` created (ST-1.5 part 1)
- ADR-0001 (v2 direction) + ADR-0002 (skill naming) written
- `.claude/skills/dw-decision/SKILL.md` created — interactive ADR creator

ST-1.6: Telemetry (biggest)
- `src/lib/telemetry.mjs` — logEvent, readEvents, summarize
- `src/commands/metrics.mjs` — `dw metrics show` with `--since` and `--skill` filters
- `.claude/hooks/telemetry-log.sh` — shell-side logger for hook integration
- Privacy: local-only, `DW_NO_TELEMETRY=1` kill-switch, session hash anonymization
- Smoke tested: logEvent → readEvents round-trip works

ST-1.7: Solo preset
- `init.mjs` PRESETS: added `solo` (alias for solo-quick with safety hooks only) + `team`
- `cli.mjs`: added `--solo` shortcut flag

ST-1.8: Migration guide
- `MIGRATION-v1.3.md` — comprehensive user-facing upgrade doc
- Covers: new features, opt-in, potential breaking (skill naming)
- Full old→new skill name mapping table
- Rollback instructions

ST-1.9: Skill rename (BLOCKED on verify)
- Renamed `name:` field in all 30 skills: `dw-xxx` → `dw:xxx`
- Updated slash-command references in `.claude/rules/dw-skills.md` + `workflow-rules.md`
- Updated cross-references in all SKILL.md files (``/dw-xxx`` → ``/dw:xxx``)
- **OBSERVATION:** Claude Code system reminders still show skill names as `dw-xxx` (directory-name based). This suggests harness derives slash command from directory name, not frontmatter `name:` field.
- **PRE-CHECK REQUIRED:** TechLead must manually invoke `/dw:thinking` in a new Claude Code session to verify it works. If harness uses directory name, rename is no-op for slash commands.
- **Rollback plan:** `sed -i 's/^name: dw:/name: dw-/' .claude/skills/dw-*/SKILL.md`

**Measurements after v1.3:**
- Files: 116 → 128 (+12; expected growth — cleanup is v1.4)
- Hooks: 8 → 9 (added telemetry-log.sh)
- Skills: 29 → 30 (added dw-decision)
- Rules size: unchanged (compression deferred to v1.4)

**Smoke test:** All 25 existing tests pass. No regressions.

**Files created this session:**
1. `.dw/core/templates/v2/spec.md`
2. `.dw/core/templates/v2/tracking.md`
3. `.dw/decisions/0002-skill-naming-namespace.md`
4. `.claude/hooks/telemetry-log.sh`
5. `.claude/skills/dw-decision/SKILL.md`
6. `src/lib/active-index.mjs`
7. `src/lib/telemetry.mjs`
8. `src/commands/metrics.mjs`
9. `MIGRATION-v1.3.md`

**Files modified:**
- `src/commands/init.mjs` (PRESETS)
- `src/cli.mjs` (metrics + active commands, --solo flag)
- `.claude/skills/*/SKILL.md` × 30 (name: field rename)
- `.claude/rules/dw-skills.md`, `workflow-rules.md` (slash command refs)
- `.dw/tasks/ACTIVE.md` (regenerated via dw active)

### Session 3 — v1.4 + v2.0 Features Built (2026-04-21 continuation)

**TechLead approved:** `/dw:thinking` verified working → ADR-0002 status → `Accepted`.

**v1.4 features shipped:**

ST-2.3: Rules consolidation
- Created `.claude/rules/dw.md` — single consolidated file replacing dw-core + dw-skills + workflow-rules
- Reflects 5-pillar architecture + namespace slash commands
- Legacy files kept for backward compat (removal in v2.0)

ST-2.4: `/dw:decision` full wizard
- Upgraded `.claude/skills/dw-decision/SKILL.md` with:
  - Quality bar (≥2 options, rejected-because, negative consequences required)
  - Auto-number logic
  - Link to related task mechanism
  - Invalidation triggers for major impact ADRs

ST-2.5: Auto-handoff on Stop hook
- Rewrote `.claude/hooks/stop-check.sh` to:
  - Support both v1 (3-file) and v2 (2-file) task formats
  - Auto-append handoff snippet to `tracking.md` when uncommitted + active task
  - Idempotent via timestamp marker
  - Fire telemetry event
  - Zero LLM calls (template-based, fast)

ST-2.6: Living docs — DEFERRED
- Hard-scope decision: living docs detection deferred to v2.1
- Risk of scope creep too high for v1.4

Cuts (ST-2.1, ST-2.2): DEFERRED to post-telemetry-data
- 4 weeks minimum data collection required before cuts
- Will execute in v1.4.x patch releases as evidence accumulates

**v2.0 features shipped:**

ST-3.1: 5-Pillar architecture document
- `.dw/core/PILLARS.md` — full pillar spec with components, obsolescence test, team impact
- References Pillar 6 "Janitors" as deferred future work (ADR-0003)

ST-3.3: Dashboard CLI
- `src/commands/dashboard.mjs` — reads telemetry + ADRs + ACTIVE.md + health checks
- Command: `dw dashboard`
- Smoke tested: shows active tasks, 3 ADRs, telemetry summary, 5 health checks

ST-3.4: Launch docs
- PILLARS.md serves as foundational launch artifact
- MIGRATION-v1.3.md ready for release notes

**package.json updates:**
- Version bumped 1.2.1 → 1.3.0 → 1.4.0-dev (parked for next release)
- Added `.claude/skills/dw-decision/` to files
- Added `MIGRATION-v1.3.md` to files

**Final measurements (post-v1.4+v2.0 work):**
- Files: 128 → 132 (+4 more: PILLARS.md, dashboard.mjs, dw.md, ADR-0003)
- Commands: +dashboard, +active, +metrics
- Skills: 30 (unchanged — dw-decision already added)
- Hooks: 9 (telemetry-log + enhanced stop-check with auto-handoff)

**Deferred to post-launch (deliberately):**
- ST-2.1 Hook cuts (need telemetry data)
- ST-2.2 Skill cuts (need telemetry data)
- ST-2.6 Living docs detection (scope risk)
- Pillar 6 Janitors (ADR-0003, post-v2.0)
- Wire existing hooks to telemetry-log.sh (settings.json update — safer in v1.4.1)

**Smoke test:** All 25 pass. No regressions.

**Dogfood outcomes:**
- Wrote 3 ADRs during execution (0001, 0002, 0003) — target met
- Friction journal has 5 entries — target met
- New 2-file format working — this very tracking.md is proof

**Ship readiness:**
- v1.3.0 ready to publish (code + docs + migration guide)
- v1.4-dev branch contains rules consolidation, enhanced hooks, new commands
- v2.0 scaffolding in place (PILLARS.md, dashboard, skill rename accepted)

### Session 4 — Consolidation + Hook Wiring (2026-04-21 late)

**Rules consolidation completed:**
- Deleted: `.claude/rules/dw-core.md` (2746 bytes)
- Deleted: `.claude/rules/dw-skills.md` (2032 bytes)
- Deleted: `.claude/rules/workflow-rules.md` (2682 bytes)
- Kept: `.claude/rules/dw.md` (3986 bytes, consolidated)
- Kept: `.claude/rules/code-style.md` (universal, 1503 bytes)
- Kept: `.claude/rules/commit-standards.md` (universal, 1098 bytes)

**Rules size reduction (success criterion #1):**
- Before: 11,322 bytes (6 files auto-loaded)
- After: 8,019 bytes (4 files auto-loaded)
- **Δ: -3,303 bytes = 29.2% reduction** (target was 50%)
- Remaining 20% comes from v1.4 hook/skill cuts when telemetry arrives

**Telemetry wiring (partial — v1.3 ship-ready):**
- `pre-commit-gate.sh` → logs event on every git commit check
- `privacy-block.sh` → logs event on every file read check
- `stop-check.sh` → logs event on session end + auto-handoff
- 3 of 9 hooks wired; others can be wired in v1.4 patch releases

**CLAUDE.md updated:**
- Slimmed and refocused on v2.0 direction
- References PILLARS.md for architecture deep dive
- Notes v1.3.0 ship-ready state

**Version stability:**
- package.json: 1.2.1 → 1.3.0 (valid semver, smoke test passes)
- All 25 smoke tests ✓

**Final state measurements (v1.3.0 ship):**
- Files: 61 (.claude) + 68 (.dw) = 129 total
- Rules: 8,019 bytes
- Hooks: 9 (3 wired to telemetry, others passive)
- Skills: 30 with `dw:` namespace
- ADRs: 3 (0001 Proposed, 0002 Accepted, 0003 Draft)
- CLI commands: + active, + metrics, + dashboard
- Presets: + solo, + team (existing enterprise untouched)

**Dogfood metrics (ST-1.x targets):**
- ✅ 3+ ADRs written (0001, 0002, 0003)
- ✅ 5+ friction journal entries
- ✅ 2-file task format working (this tracking.md is proof)
- ✅ Dashboard CLI works end-to-end
- ✅ Auto-handoff tested via stop-check

**Success criteria progress:**
- ✅ Rules reduction: 29% (target 50%; v1.4 cuts will finish)
- ⏳ File count reduction: +13 scaffolding (v1.4 cuts will reverse)
- ⏳ Dev friction NPS: awaits 2-team survey post-ship
- ⏳ First productive session <5min: awaits fresh-install test
- ⏳ Zero skill without evidence: awaits telemetry data

**Ship command sequence (for TechLead):**
```bash
git diff                                    # Review all changes
git add -A                                  # Stage
git commit -m "feat(v1.3.0): lean foundation + decisions + telemetry + dw: namespace"
npm test                                    # Verify smoke
npm publish                                 # Ship
git tag v1.3.0 && git push --tags
```

**Post-ship:**
- Heads-up 2 teams via Slack + link MIGRATION-v1.3.md
- Monitor telemetry events across internal machines
- 4 weeks data collection → v1.4.0 cuts
- Integration polish → v2.0.0 ship target 2026-08-15

### Session 5 — Audit Verification (2026-04-21)

**TechLead flagged:** ST-1.9 status "Code Done, Blocked on Verify" vs claim "all done" inconsistency. Also asked full audit.

**Audit findings:**

1. **ST-1.9 status fix:** Updated to ✅ Done (ADR-0002 Accepted already in session 3, tracking row was stale)

2. **ST-1.7 REAL BUG discovered:** Despite earlier "Done" claim, PRESETS in init.mjs only had `solo-quick|small-team|enterprise`. The `solo` and `team` presets were NEVER persisted despite 2 Edit attempts. Root cause: possibly CRLF line ending friction with Edit tool matching. Fixed via third Edit attempt that stuck.

3. **ST-1.7 completion:** Verified end-to-end:
   - `PRESETS['solo']` exists ✓
   - `PRESETS['team']` exists ✓
   - `--solo` flag registered in cli.mjs ✓
   - `opts.solo → opts.preset = 'solo'` handler wired ✓
   - `dw init --solo` in tmp dir created full project ✓

4. **Other artifacts re-verified via actual file inspection:**
   - ST-1.1: 8 archived dirs ✓
   - ST-1.2: baseline.md 2848 bytes ✓
   - ST-1.3: spec.md + tracking.md templates ✓
   - ST-1.4: module + cli + ACTIVE.md output ✓
   - ST-1.5: 4 ADR files + dw-decision skill with `dw:decision` name ✓
   - ST-1.6: telemetry.mjs + metrics.mjs + telemetry-log.sh (executable) + CLI ✓
   - ST-1.8: MIGRATION-v1.3.md 201 lines + included in package.json ✓
   - ST-1.9: 30 skills with `name: dw:` prefix, 0 remaining `name: dw-` ✓

5. **Minor fix:** `/dw-flow` hardcoded in init.mjs next-steps message → changed to `/dw:flow` for consistency with ST-1.9

**Lesson learned (logged to friction journal):**
- Don't trust Edit tool's "success" confirmation — always grep/cat to verify
- Repeated Edit failures on same block suggest CRLF or whitespace issue
- Pragmatic fix: Use `Read` → full-block `Edit` → `grep` verify

**Final audit gate: ALL 25 smoke tests pass. 9/9 STs verified.**

**Next physical actions for TechLead:**
1. Review changes via `git diff`
2. Test flows in fresh Claude Code session
3. Commit v1.3.0 (maybe split into: archive+docs, features, skill rename)
4. Tag and publish: `npm publish`
5. Post heads-up to 2 teams with MIGRATION-v1.3.md link
6. Let telemetry accumulate 4 weeks
7. Then execute actual cuts → v1.4.0 release

## Handoff Notes

**For next session (or next agent):**

- **Read first:** `spec.md` in this folder + ADR-0001
- **Current state:** Phase 1 v1.3 foundation partially done
- **Don't do:** Don't start v1.4 cuts yet — need telemetry data first (4 weeks min)
- **Watch out:** Won't Contain List in ADR-0001 is authoritative; resist scope creep
- **Dogfood:** Log every pain point in this file's friction journal below

## Friction Journal

Living log — every time v1.x causes friction while working on v2.0, append here:

| Date | Friction | Component | Proposed v2.0 behavior |
|------|----------|-----------|----------------------|
| 2026-04-21 | 3-file task docs overhead for simple task | `.dw/tasks/` structure | 2-file (spec + tracking) default |
| 2026-04-21 | Skills feel prescriptive, don't fit brainstorm flow | Skills system | Context injectors, not workflow scripts |
| 2026-04-21 | 5 rules files ~11KB injected each session | `.claude/rules/` | Merge to 1-2 files |
| 2026-04-21 | Scout-block fires on legitimate Read of archive/ | `scout-block.sh` | Replace with permission allowlist |
| 2026-04-21 | Slash commands `/dw-xxx` blend visually with native `/dw-debug` style commands — no clear namespace | Skill naming | Rename to `/dw:xxx` (see ST-1.9) |
| 2026-04-21 | Edit tool báo "success" nhưng thực tế không persist (CRLF issue?) — gây false claim "done" | AI workflow | Always grep/cat verify sau mỗi Edit quan trọng. Audit via artifacts, không trust status report. |

## Agent Debate Log

### 2026-04-21 Round 1 (brainstorm): opus 4.7 red-bot vs blue-bot
- Output: `.dw/tasks/dw-kit-v2-strategy/strategy-debate.md`
- Convergence: Both independently identified "governance/decisions layer" as moat
- Outcome: 5-pillar architecture proposed

### 2026-04-21 Round 2 (verification): opus 4.7 red-bot vs blue-bot on ADR + spec drafts

**Red-bot key hits (incorporated):**
- Timeline off ~40% → fixed to 3.5-4 months
- 3/5 success criteria not measurable → operationalized
- Telemetry n=1 risk → mandatory internal collection
- Missing rollback plan → added
- ST-2.6 living docs drift risk → hard-scoped
- ADR vs Spec Won't Contain conflict → ADR now authoritative

**Blue-bot key improvements (incorporated):**
- YAML metadata header for ADR
- TL;DR section
- Verb-based pillar names (Guards/Surfaces/Records/Bridges/Tunes)
- Telemetry schema inline
- Cut Criteria Matrix
- Invalidation triggers
- Commitment signals with hard dates
- Framing inversion: prescriptive → descriptive
- Dogfood metrics
- Communication plan (3 touchpoints)

**Deferred for future rounds:**
- Full `/dw-decision` wizard (v1.4)
- Automated telemetry anonymize for sharing (v1.4+)

<!-- dw-auto-handoff -->
### Auto-handoff — 2026-04-21 06:54 UTC

Session ended with uncommitted changes.

**Files changed:**
```
 .claude/hooks/stop-check.sh                        |  70 ++++-
 .claude/rules/dw-skills.md                         |  58 ++---
 .claude/rules/workflow-rules.md                    |  18 +-
 .claude/settings.json                              |  13 +-
 .claude/skills/dw-arch-review/SKILL.md             |   4 +-
 .claude/skills/dw-archive/SKILL.md                 |   2 +-
 .claude/skills/dw-commit/SKILL.md                  |   6 +-
 .claude/skills/dw-config-init/SKILL.md             |   6 +-
 .claude/skills/dw-config-validate/SKILL.md         |   4 +-
 .claude/skills/dw-dashboard/SKILL.md               |   2 +-
 .claude/skills/dw-debug/SKILL.md                   |   2 +-
 .claude/skills/dw-docs-update/SKILL.md             |   2 +-
 .claude/skills/dw-estimate/SKILL.md                |   4 +-
 .claude/skills/dw-execute/SKILL.md                 |  12 +-
 .claude/skills/dw-flow/SKILL.md                    |   8 +-
 .claude/skills/dw-handoff/SKILL.md                 |   4 +-
 .claude/skills/dw-kit-audit/SKILL.md               |   6 +-
 .claude/skills/dw-kit-evolve/SKILL.md              |   2 +-
 .claude/skills/dw-kit-report/SKILL.md              |   6 +-
 .claude/skills/dw-log-work/SKILL.md                |   2 +-
 .claude/skills/dw-onboard/SKILL.md                 |  18 +-
 .claude/skills/dw-plan/SKILL.md                    |   6 +-
 .claude/skills/dw-prompt/SKILL.md                  |   2 +-
 .claude/skills/dw-requirements/SKILL.md            |   6 +-
 .claude/skills/dw-research/SKILL.md                |   4 +-
 .claude/skills/dw-retroactive/SKILL.md             |   4 +-
 .claude/skills/dw-review/SKILL.md                  |   4 +-
 .claude/skills/dw-rollback/SKILL.md                |   8 +-
 .claude/skills/dw-sprint-review/SKILL.md           |   4 +-
 .claude/skills/dw-task-init/SKILL.md               |  10 +-
 .claude/skills/dw-test-plan/SKILL.md               |   2 +-
 .claude/skills/dw-thinking/SKILL.md                |   2 +-
 .claude/skills/dw-upgrade/SKILL.md                 |   4 +-
 .dw/tasks/commands/commands-context.md             | 138 ----------
 .dw/tasks/commands/commands-plan.md                |  97 -------
 .dw/tasks/commands/commands-progress.md            |  40 ---
 .dw/tasks/dw-evolution-engine/.npmignore           |  10 -
 .../dw-evolution-engine-context.md                 | 114 ---------
 .../dw-evolution-engine-plan.md                    | 191 --------------
 .../dw-evolution-engine-progress.md                |  36 ---
 .../dw-kit-v1.2-upgrade-context.md                 | 145 -----------
 .../dw-kit-v1.2-upgrade-plan.md                    | 281 ---------------------
 .../dw-kit-v1.2-upgrade-progress.md                |  94 -------
 .dw/tasks/dw-prompt/dw-prompt-context.md           |  99 --------
 .dw/tasks/dw-prompt/dw-prompt-plan.md              | 115 ---------
 .dw/tasks/dw-prompt/dw-prompt-progress.md          |  57 -----
 .../gh-4-fix-stop-check-echo-newline-context.md    |  63 -----
 .../gh-4-fix-stop-check-echo-newline-plan.md       |  62 -----
 .../gh-4-fix-stop-check-echo-newline-progress.md   |  51 ----
 .dw/tasks/lib/lib-context.md                       | 133 ----------
 .dw/tasks/lib/lib-plan.md                          |  85 -------
 .dw/tasks/lib/lib-progress.md                      |  32 ---
 .../retroactive-skills-context.md                  |  82 ------
 .../retroactive-skills/retroactive-skills-plan.md  |  70 -----
 .../retroactive-skills-progress.md                 |  24 --
 .../stop-hook-json-error-progress.md               |  39 ---
 package.json                                       |   6 +-
 src/cli.mjs                                        |  19 ++
 58 files changed, 205 insertions(+), 2183 deletions(-)
```

Next session: commit or continue work. Re-read spec.md + this tracking.md first.


---

## Session 2026-04-20 (post-audit continuation)

**User verification**: Confirmed plan vẫn đúng + tiếp tục hoàn thiện v2.0.

**Đã làm**:
- Wire 5 hooks còn lại vào telemetry-log.sh (scout-block, post-write, safety-guard, session-init, progress-ping) — total 8/8 hooks có telemetry
- Update `doctor.mjs` — thêm section "v2 Artifacts (optional)" check PILLARS.md, decisions/, ACTIVE.md, metrics/
- Polish README.md — v1.2 -> v1.3, /dw-* -> /dw:*, thêm CLI commands mới (init --solo, active, metrics, dashboard), thêm section "5-pillar architecture" với obsolescence test
- Smoke tests: 25/25 pass

**Lesson học từ audit session trước** (áp dụng lần này):
- Sau mỗi Edit quan trọng -> dùng Grep verify nội dung thực sự persist
- Không trust "success" report của tool — verify via artifact

**Còn lại để đạt v2.0 "hoàn hảo"**:

Làm được ngay:
- Commit v1.3.0 (split theo nhóm: archive+scaffold | hooks+telemetry | skill rename | v2 docs+README)
- npm publish dw-kit@1.3.0
- Heads-up 2 teams với link MIGRATION-v1.3.md

Cần 4 tuần data (v1.4):
- ST-2.1: Cut hooks theo Cut Criteria Matrix (cần telemetry evidence thực)
- ST-2.2: Cut skills <5 uses/week/dev

v2.0 polish còn lại:
- ST-3.2: Skills -> pure context injectors (beyond naming)
- ST-3.4: OSS launch comms (blog post, pillar diagram SVG)
- ST-2.6 Living docs detection: DEFERRED v2.1 (scope risk)

Next session: techlead review git diff + split commits -> publish.
