# dw-kit v2.0 — 5 Pillar Architecture

dw-kit v2.0 positions itself as a **Context-First SDLC Governance Layer** — not a prescriptive workflow engine. AI drives execution; dw-kit provides guardrails, context, and decision trail.

**Framing inversion:** `prescriptive workflow → descriptive governance`. Moat is organizational memory compounding over time — something IDE tools (Cursor, Copilot) structurally cannot own because they are session-scoped.

---

## Pillar 1: GUARDS — Block unsafe actions

**Role:** Non-negotiable safety boundaries. Enforced by hooks, zero discretion.

**Components:**
- `.claude/hooks/privacy-block.sh` — Prevent reading `.env*`, `credentials*`, `*.pem`, key files
- `.claude/hooks/pre-commit-gate.sh` — Quality checks + sensitive data scan before commits

**Obsolescence test:** AI gets smarter → safety becomes MORE important (velocity × risk). These hooks never obsolete.

**Team impact:** Prevents accidents at individual dev level, reduces incident count team-wide.

---

## Pillar 2: SURFACES — Make state visible

**Role:** Shared team context. Human and AI both read.

**Components:**
- `.dw/tasks/ACTIVE.md` — Auto-generated index of active tasks (TechLead cat to see team state)
- `.dw/context/project-map.md` — Module structure and boundaries
- `.dw/context/modules/*.md` — Per-module documentation
- `CLAUDE.md` + `.claude/rules/dw.md` — Auto-injected conventions

**Obsolescence test:** AI gets smarter → teams coordinate more ambitiously → surfaces become MORE load-bearing.

**Team impact:** New dev onboards from surfaces alone. TechLead audits without asking devs "what are you doing?"

---

## Pillar 3: RECORDS — Capture decisions

**Role:** Organizational memory. The WHY behind architectural choices.

**Components:**
- `.dw/decisions/{NNNN}-{title}.md` — ADRs with structured YAML header
- `/dw:decision` skill — Interactive ADR wizard
- Status tracking: `Proposed | Accepted | Deprecated | Superseded by ADR-{NNNN}`

**Obsolescence test:** AI gets smarter → needs WHY context to avoid technically-correct but strategically-wrong decisions. ADRs become MORE valuable.

**Team impact:** Replaces scattered Slack threads. 6-month-old devs find decision trail. New hires understand architecture fast.

**Unique moat:** IDE tools (Cursor, Copilot) structurally can't own this — they're session-scoped, ADRs are cross-session artifacts.

---

## Pillar 4: BRIDGES — Connect across sessions

**Role:** Continuity over time. Handle the "long chat → no handoff → team lost context" problem.

**Components:**
- `.dw/tasks/{task}/tracking.md` — Mutable progress log with friction journal
- Stop hook auto-handoff — Appends session summary to tracking.md on uncommitted changes
- (v2.0+) Living docs detection — Flag when code diverges from docs

**Obsolescence test:** AI sessions remain ephemeral regardless of capability. Bridges always needed.

**Team impact:** Pick-up-where-left-off works across devs and across sessions. TechLead sees real velocity from actual logs, not status meeting summaries.

---

## Pillar 5: TUNES — Behavioral knobs

**Role:** Team/solo customization. Governs how Pillars 1-4 behave.

**Components:**
- `.dw/config/dw.config.yml` — Master config (depth, roles, flags)
- `.dw/config/dw.config.local.yml` — Machine-specific override (gitignored)
- Presets: `solo` · `team` · `enterprise`
- Depth routing: `quick` · `standard` · `thorough`
- Role system: `dev` · `techlead` · `ba` · `qc` · `pm`

**Obsolescence test:** Team size and preferences always vary. Config always needed.

**Team impact:** Same dw-kit serves vibe coder (preset solo) and enterprise team (preset enterprise) with same core.

---

## Pillar Cross-References

| Question | Answer location |
|----------|----------------|
| "Is this safe to do?" | Pillar 1 (Guards) — hooks block |
| "What's everyone working on?" | Pillar 2 (Surfaces) — ACTIVE.md |
| "Why did we choose X?" | Pillar 3 (Records) — ADRs |
| "Where were we yesterday?" | Pillar 4 (Bridges) — tracking.md |
| "How does our team work?" | Pillar 5 (Tunes) — config + presets |

## Design Principles

1. **Descriptive, not prescriptive** — AI chooses approach; dw-kit supplies context + safety
2. **Obsolescence-aware** — Every feature passes "more valuable if AI smarter?" test
3. **Dual audience** — Solo + team from same core, different defaults
4. **Data-driven evolution** — Telemetry guides cut decisions, not gut-feel
5. **Escape hatches** — `--no-dw`, `legacy_features: true`, `DW_NO_TELEMETRY=1`

## Future: Pillar 6 — JANITORS (deferred to post-v2.0)

**Status:** Draft, deferred — see `.dw/decisions/0003-pillar-6-janitors.md`

**Role:** Reactive cleanup of AI-generated waste. Current 5 pillars are *preventive* (govern what goes in); Janitors governs *what stays*.

**Rationale:** When 99% of code is AI-generated, prevention alone cannot scale. Inspired by urban waste management — cities use multi-tier systems (sort → collect → recycle → regulate), not just "don't litter."

**Revisit:** After v2.0 GA (post 2026-08-15), based on real-world friction data.

## Versioning

- **v1.3** — Foundation (new format, scaffolding, telemetry)
- **v1.4** — Data-driven cuts based on telemetry evidence
- **v2.0** — Unified release with full 5-pillar integration
- **v2.1+** — Advanced features (auto-handoff LLM, cross-repo, dashboard UI)
- **v2.2+** — Janitors pillar (if validated by v2.0 friction data)
