---
title: Supply-Chain Guard — Strategic vs Tactical Dispute (Voter Brief Artifact)
date: 2026-05-12
purpose: Self-contained voter-brief artifact (Bug 4 v2 fix). Pre-sanitized — contains policy framing only, no attack technical detail. Voters reference THIS file, not the incident report.
---

# Strategic vs Tactical Dispute — Supply-Chain Guard for dw-kit

> Self-contained brief for Multi-Agent Decision Pattern voters. No references needed outside this doc to give voter verdict. Avoids Bug 4 (AUP topic-sensitivity) by keeping all threat references at policy abstraction level.

---

## 1. Context

**dw-kit** = AI development workflow toolkit (Node.js CLI + Claude Code hooks/skills/rules), Pragmatic Lean direction per ADR-0001 (cut-50% surface, ship v2.0 by 2026-08-15), 5 pillars (Guards / Surfaces / Records / Bridges / Tunes), audience: solo / team / enterprise presets.

**Trigger event:** A supply-chain incident affecting popular npm namespaces occurred 2026-05-11 (one day before this discussion). dw-kit itself + TechLead's local machine verified unaffected. Team-wide triage pending.

**Question:** Should dw-kit ship a supply-chain guard feature?

---

## 2. Two Framings Being Disputed

### Tactical Frame (Devil's Advocate position from prior pattern rounds)

- Original 14-18h proposal is incident-response panic build
- Curated indicator-of-compromise (IoC) bundle = forever maintenance debt, single-maintainer bus-factor
- 80% of practical risk reduction already free from: `npm config set ignore-scripts true` + team broadcast template (already prepared)
- Phase 1 MVP without integration hook = vanity ship
- Goes against ADR-0001 cut-50% goal + threatens v2.0 ship deadline
- "Capture window after incident" framing is marketing-currency rationalization, not retention-currency value
- **Verdict:** Defer entirely, OR adopt ultra-narrow 3-4h (just hook + 1 commit-pinned fixture, sunset 90 days)

### Strategic Frame (TechLead position)

- Position dw-kit feature as **moat: AI-Native Supply-Chain Guard wired into AI coding workflow**
- Differentiator vs commercial tools (Snyk / Socket / OSV-scanner): they assume human authors lockfile commits; dw-kit assumes AI agents do
- AI agents have measurably different risk profile: auto-add deps without scrutiny, favor trending packages (which are attacker targets), auto-approve installs
- Other AI coding tools (Cursor / Copilot / Sourcegraph) do not own this space — genuine positioning vacuum
- **Key design change vs original proposal:** drop solo-curated IoC bundle, use auto-sync from official multi-maintainer feeds (GitHub Security Advisories + OSV.dev). Adapter is transform layer, not data curation.
- Sunset rule preserved: 90 days post-ship, retire if zero real catches + zero adoption signal
- Speed-to-ship matters — OSS marketing currency captured in days, not months
- **Verdict:** Ship aggressive 12h single batch as point release within 1 week

### DA Refined Position (after seeing strategic frame, round 2 of pattern)

DA shifted from Defer → MODIFY mid-scope **6-8h**, partially conceding strategic frame:

**Conceded to strategic frame (3 valid points):**
1. Auto-sync from official feeds (OSV/GHSA) does structurally dissolve bus-factor — not rhetoric
2. AI-specific risk profile at the Edit-lockfile boundary is measurably different from commercial tools' assumed deployment surface
3. ADR-0001 cut-50% applies to skill/hook/rule duplication, not net-new pillar capability — Guards layer is allowed to grow

**Still flagged as rationalization risk (3 points):**
1. "Speed-to-ship in 1 week" is panic timing — ship under deadline pressure correlates with ship-then-abandon
2. "Competitive gap exists" doesn't equal "should fill" — vacuum may exist because no one wants the maintenance
3. Auto-sync only solves bus-factor IF adapter stays minimal; scope creep returns the debt through the back door

**DA refined tweak:** hook + auto-sync adapter (read-only, no manual curation, no canonical bundle repo) + 90-day sunset metric. Drop urgency this week, target the next patch release (v1.4.x) instead of emergency v1.3.5.

---

## 3. Three Candidate Verdicts

| Verdict | Effort | Scope | Timing |
|---|---|---|---|
| **A. Ship aggressive (TechLead)** | 12h | Hook + auto-sync + CLI + doctor + dashboard + freshness | v1.3.5 emergency 1 week |
| **B. Mid-scope (DA refined)** | 6-8h | Hook + auto-sync (read-only) + sunset metric only | v1.4.x patch ~3-6 weeks |
| **C. Ultra-narrow (DA round 1)** | 3-4h | Hook + 1 commit-pinned fixture, sunset 90 days | v1.4.x patch |
| **D. Defer** | 0h | Document position, revisit later | None |

---

## 4. What Voters Are Asked

From your role's lens:

1. Which verdict (A / B / C / D) is most defensible?
2. Is the **strategic framing** valid, overstated, or invalid?
3. If you want changes (MODIFY), what specifically?
4. What is the biggest risk of your recommendation?

Output strict format provided in your individual brief.

---

## 5. Key References (do not need to read for verdict — for follow-up only)

- Original proposal full design: `.dw/research/supply-chain-guard-proposal.md` Sections 1-8 (Section 9 is voter-feedback log, can be skipped)
- ADR-0001 (constraint anchor): `.dw/decisions/0001-v2-pragmatic-lean.md`
- PILLARS architecture: `.dw/core/PILLARS.md`
- Multi-agent pattern doc + Bug 4: `.dw/research/multi-agent-decision-pattern.md`

**Sufficient for verdict:** this dispute file alone. References optional.

---

**End of strategic-dispute brief.**
