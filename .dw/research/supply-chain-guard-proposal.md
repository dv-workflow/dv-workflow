---
title: Supply-Chain Guard for dw-kit — Proactive Detection Layer (AI-Native)
date: 2026-05-12
status: ACCEPTED — Path A (ship aggressive v1.3.5 in 7-10 days, full scope + 6 tweaks)
trigger: Mini Shai-Hulud TanStack worm 2026-05-11
companion: .dw/research/supply-chain-incident-2026-05-12.md
pillar: Guards (preventive block of unsafe install/commit)
voter-feedback: 8 voters across 3 rounds (Bug 4 v2 fix verified — see multi-agent-decision-pattern.md)
final-verdict: A — Ship v1.3.5 in 7-10 days, full scope, 6 tweaks integrated, public 90-day sunset commitment
authority: TechLead override panel consensus B with Bug 5 (effort-anchoring) reframe + GVC's TW6 (public sunset kill-switch)
adr: ADR-0005 (Accepted)
implementation-task: .dw/tasks/sc-guard-v1.3.5/
---

# Supply-Chain Guard — Proactive Detection Layer for dw-kit

> **Why this doc:** TanStack worm 2026-05-11 highlighted a gap — dw-kit currently has zero supply-chain awareness. Team relies on `npm audit` (reactive, advisory-lagged) and manual vigilance. We were lucky this time (no team install in window). Goal: make next attack detected within minutes on any team machine, not hours.

---

## 1. Problem Statement

### What dw-kit doesn't do today

- No scan when `package-lock.json` changes
- No IoC awareness — dw-kit can't detect known-bad payload filenames or exfil domains in `node_modules/`
- No team-wide alerting — even if one machine detects, others don't know
- No pre-commit gate on lockfile changes for risky versions
- `dw doctor` doesn't have security health-check section

### What attackers exploit

- **Time-to-detection gap**: between attacker publish and npm pull-down (often 1-24h)
- **CI OIDC token theft**: most damaging because worm self-propagates from stolen token
- **Postinstall scripts**: default-on for most installs; primary execution path
- **Lockfile invisibility**: developers rarely diff lockfiles before commit
- **Namespace trust**: `@trusted-org/*` packages assumed safe

### What we want

A **Guards-pillar** layer that:
1. Detects IoC presence quickly (post-install scan)
2. Blocks committing lockfile changes containing known-bad versions
3. Surfaces dependency novelty signals (suspiciously recent publish dates)
4. Doesn't require network for fast path (curated IoC ships with dw-kit)
5. Optional: live registry advisory check (slower, opt-in)

---

## 2. Design

### Architecture

```
┌─ Guards Pillar (existing) ─────────────────────────────────┐
│                                                            │
│  privacy-block       pre-commit-gate     stop-check       │
│                                                            │
│  + NEW: supply-chain-guard (3 entry points)               │
│    ├─ post-install scan    (hook on package.json change)  │
│    ├─ pre-commit lockfile  (block bad versions in commit) │
│    └─ `dw security-scan`   (on-demand CLI)                │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Data: .dw/security/ ──────────────────────────────────────┐
│  ioc-packages.json   — curated compromised version list   │
│  ioc-files.json      — known payload filenames            │
│  ioc-domains.json    — exfil domain list                  │
│  trust-policy.json   — namespace allow/deny + freshness   │
│  cache/last-scan.json — incremental scan state            │
└────────────────────────────────────────────────────────────┘
```

### Component 1 — `dw security-scan` CLI command

Read-only audit, runs on demand or via hook. Outputs report + non-zero exit on findings.

```
dw security-scan [--quick] [--ioc-only] [--update-db] [--json]

Modes:
  --quick     IoC list cross-reference only, no network (~1s)
  default     IoC + npm audit + freshness check (~5-15s)
  --update-db Fetch latest IoC bundle from canonical source
```

#### Checks performed

1. **IoC version match** (offline)
   - Parse `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`
   - For each dep: lookup in `ioc-packages.json`
   - Report: package + installed version + advisory + fix version

2. **IoC file scan** (offline)
   - Walk `node_modules/` (depth ≤ 5, skip if large)
   - Find files matching `ioc-files.json` (filename patterns)
   - Report: file path + IoC name + first 200 bytes hash

3. **IoC domain grep** (offline)
   - ripgrep `node_modules/` for domains in `ioc-domains.json`
   - Use `--no-ignore` to scan even gitignored
   - Report: file:line + matched domain

4. **Freshness check** (offline; uses lockfile metadata)
   - For each dep version, check `published` timestamp in lockfile
   - Flag deps published in last 72 hours (configurable)
   - Cross-reference: was this dep ALREADY in prior lockfile? If yes → version bump in last 72h = higher risk
   - Note: this is a heuristic, not a verdict — produces "review" not "block"

5. **Live advisory check** (online, optional)
   - Run `npm audit --json` and parse
   - Report only HIGH/CRITICAL severity
   - Skip if offline or `--ioc-only` flag

6. **Trust policy check** (offline)
   - Read `trust-policy.json` (project-level overrides via `.dw/config/`)
   - Block deps from blocklisted namespaces
   - Warn deps NOT in allowlist (if strict mode)

#### Exit codes

| Code | Meaning |
|---|---|
| 0 | All clean |
| 1 | Warnings only (freshness, info advisory) |
| 2 | High severity advisory OR IoC version match OR IoC file/domain hit |
| 3 | Database stale (>30 days since update) + finding |

### Component 2 — Post-install hook (`.claude/hooks/supply-chain-scan.sh`)

Trigger: Claude Code Edit/Write tool modifies `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`, OR human runs install (detected via file mtime delta).

Behavior:
- Run `dw security-scan --quick` (IoC-only, fast)
- If exit ≥ 2: print loud warning, recommend abort
- Log event to telemetry (`supply_chain.scan.found`)

Lightweight: only IoC list, no network, target <1s.

### Component 3 — Pre-commit lockfile gate

Extends existing `pre-commit-gate.sh` hook:

- Detect staged `*lock*` file changes
- Run `dw security-scan --quick` on staged version
- Block commit if exit ≥ 2; print fix command (`npm install <pkg>@<fix-version>`)

### Component 4 — `dw doctor` integration

Add new section:

```
Security
  ✓ IoC database: 2026-05-12 (3 hours old)
  ✓ Last scan: 2026-05-12 09:15 — 0 IoC matches, 1 advisory (low)
  ⚠ Freshness check: 2 deps published in last 72h (jsx-helper@1.2.3, css-toolkit@0.4.1)
  ✓ Trust policy: 0 violations
```

### Component 5 — `dw dashboard` + telemetry integration

Add tile to dashboard: "Security scans this week: 14 runs, 0 IoC hits, 2 advisories triaged."

Telemetry events:
- `supply_chain.scan.run` (count, mode, duration)
- `supply_chain.scan.found` (severity, count by type)
- `supply_chain.db.update` (success/fail, version)

---

## 3. Curated IoC Database

### Schema (`.dw/security/ioc-packages.json`)

```json
{
  "schema_version": "1.0",
  "updated": "2026-05-12T10:00:00Z",
  "source": "https://github.com/dv-workflow/dw-kit-ioc-bundle",
  "entries": [
    {
      "name": "@tanstack/react-router",
      "compromised_versions": ["1.169.5", "1.169.6", "1.169.7", "1.169.8"],
      "fix_version": "1.169.9",
      "advisory": "GHSA-g7cv-rxg3-hmpx",
      "cve": "CVE-2026-45321",
      "attack_window_utc": "2026-05-11T19:20:00Z/2026-05-11T19:26:00Z",
      "severity": "critical",
      "exfiltrates": ["npm-token", "github-token", "cloud-keys", "ssh-keys", "claude-config", "crypto-wallets"]
    }
  ]
}
```

Mirror structure for `ioc-files.json` (payload filenames) and `ioc-domains.json` (exfil domains).

### Data update mechanism

- **Canonical source:** GitHub repo `dv-workflow/dw-kit-ioc-bundle` (or similar). PRs welcome from community.
- **Update command:** `dw security-scan --update-db` fetches latest JSON. Verifies SHA-256 against committed `db.sha256` file.
- **Auto-update:** opt-in via config. Default: warn if DB >30 days old.
- **Offline fallback:** dw-kit npm package ships with snapshot at release time; `dw security-scan --quick` works fully offline.

### Quality control

- Each IoC entry must reference an authoritative source (GHSA, Snyk, advisory blog).
- Schema validation via JSON Schema on every commit.
- Auto-prune entries marked `superseded_by_fix` after 90 days (with grace flag).
- No false-positive entries (compromised version range must be precise).

---

## 4. Implementation Plan

### Phase 1 — MVP (~6-8h)

| # | Subtask | Effort | Output |
|---|---|---|---|
| ST-1 | Schema design + sample IoC bundle | 1h | 3 JSON files in `.dw/security/` |
| ST-2 | `src/lib/supply-chain.mjs` core scanner | 2-3h | Parsers for npm/pnpm/yarn lockfiles + IoC matchers |
| ST-3 | `src/commands/security-scan.mjs` CLI | 1.5h | `dw security-scan` command |
| ST-4 | Smoke tests | 1h | 5-8 test cases |
| ST-5 | Doc: 1 section in CLAUDE.md + README | 0.5h | User-facing docs |

**MVP scope deliberately small**: offline IoC scan only, no hook, no doctor integration. Validates the core check works.

### Phase 2 — Integration (~3-4h)

| # | Subtask | Effort | Output |
|---|---|---|---|
| ST-6 | `.claude/hooks/supply-chain-scan.sh` post-write hook | 1h | Wired in settings.json |
| ST-7 | `pre-commit-gate.sh` lockfile gate extension | 1h | Block bad-version commits |
| ST-8 | `dw doctor` security section | 0.5h | New section in doctor output |
| ST-9 | Telemetry events | 0.5h | 3 new event types |
| ST-10 | Doc: PILLARS.md update (Guards entry) | 0.5h | Architecture doc |

### Phase 3 — Network features (~3-4h, opt-in)

| # | Subtask | Effort | Output |
|---|---|---|---|
| ST-11 | `--update-db` fetch from canonical repo | 1.5h | DB sync mechanism |
| ST-12 | `npm audit` integration in default mode | 1h | Live advisory check |
| ST-13 | Freshness heuristic (72h publish window) | 1h | Recently-published flagging |

### Phase 4 — Distribution (~2h)

| # | Subtask | Effort | Output |
|---|---|---|---|
| ST-14 | Create `dv-workflow/dw-kit-ioc-bundle` repo | 0.5h | Canonical source |
| ST-15 | Seed initial IoC bundle (TanStack + recent 6mo incidents) | 1h | Production data |
| ST-16 | Community contribution guide | 0.5h | CONTRIBUTING.md for IoC PRs |

**Total estimate:** 14-18h across 4 phases. Phase 1 alone is shippable.

---

## 5. Trade-offs

### Pros

- **Fast offline scan** (~1s) — runs on every lockfile change without ceremony
- **Pillar-aligned** — fits Guards perfectly (preventive block)
- **Audience universal** — solo / team / enterprise all benefit
- **Reversible** — pure addition, no breaking change to existing dw-kit
- **Future-proofs against next worm** — generic IoC schema works for any incident type
- **Community-supported** — IoC bundle can be PR-contributed, distributes maintenance load
- **Marketing-positive** — actually defensive, unlike "Bayesian governance" risk (per ADR-0004 §"Negative")

### Cons

- **Reactive on novel attacks** — only catches what's in IoC list; zero-day still slips
- **IoC bundle maintenance** — needs ongoing curation; bus-factor risk
- **False positives possible** — version-range matching could misfire on rare semver edge cases
- **Bypass-able** — sophisticated attacker reads dw-kit IoC list, avoids matching
- **DB staleness risk** — if bundle not updated, users get false sense of safety. Mitigation: `dw doctor` warns on stale DB.
- **Scope creep magnet** — once shipped, community will request "scan PyPI", "scan Go modules", "scan Docker images". Per ADR-0001 Won't Contain list: must hard-resist.
- **Effort cost** — 14-18h is real budget. ADR-0001 cut-50% goal — adding new feature seems to fight that. **Defense:** Guards layer is intentionally allowed to grow; the cut goal applies to skills + hooks + rules duplication, not to net-new pillar capabilities.

### Obsolescence test

Does this depreciate as AI improves?

- **Partial yes:** smarter AI can grep IoC list directly without dw-kit's wrapper, OR use LLM agent to triage `npm audit` output. But the **curated IoC bundle** + **fast offline path** + **integration with dw workflow (commit gate, doctor, telemetry)** retain value because they're structural — they make the right check happen automatically at the right moment, not just possible.
- **Decision:** PASS obsolescence test. Value is in the workflow integration + curated data, not the math.

---

## 6. Open Questions

1. **Lockfile coverage:** ship parsers for npm + pnpm + yarn from MVP, or npm only? (pnpm/yarn ~30% of team adoption?)
2. **IoC bundle versioning:** semver tied to dw-kit, or independent? Independent allows fast IoC updates without dw-kit release.
3. **Hook trigger:** post-Edit-of-lockfile (Claude Code-specific), or post-install detection (FS mtime)? Both?
4. **Privacy:** any telemetry events leak project-specific deps externally? Default: aggregate counts only, never package names.
5. **Strict mode vs warn mode:** default behavior on IoC match — `block commit` or `warn only`? Recommend: block for IoC version match (clear bad), warn for freshness heuristic (probabilistic).
6. **PyPI/Go/Cargo:** scope creep — defer to v2 of guard or never. Per ADR-0001 lean goal: never.
7. **Integration with Pillar 6 Janitors (deferred):** if Janitors un-defers, supply-chain guard becomes a Janitor sub-component? Or stays in Guards? Currently: Guards (preventive ≠ reactive cleanup).

---

## 7. Decision Path

This proposal is a **research note**, not yet ADR. Per Multi-Agent Decision Pattern (today's reflection, [multi-agent-decision-pattern.md](multi-agent-decision-pattern.md)) and dw-kit's "Pragmatic Lean" principle:

1. **Solo review:** TechLead reads this doc, decides scope (full / MVP-only / reject).
2. **If proceed:** draft **ADR-0005** with Status: Proposed → team PR review.
3. **If concerns:** run Multi-Agent Decision Pattern (A/B research + voter panel) before commitment. Especially:
   - Devil's Advocate role: "this is an incident-response panic feature, will it still feel valuable in 6 months?"
   - Solo Dev voter: "I install dw-kit for the workflow, not security; is this scope creep?"
   - OSS Maintainer voter: "IoC bundle maintenance is forever — bus-factor risk?"

4. **Phasing:** if accepted, ship Phase 1 in v1.4.x patch release (not v2.0). Avoids blocking v2.0 timeline (2026-08-15).

### Recommended next step

Given the timing (incident is hot, action helps team), recommend:

- **Today/this week:** Ship the incident report ([supply-chain-incident-2026-05-12.md](supply-chain-incident-2026-05-12.md)) team-wide. Use the broadcast template. Triage team repos.
- **This/next week:** Decide on Phase 1 MVP scope. If green-light → draft ADR-0005 + spec task in `.dw/tasks/supply-chain-guard/`.
- **Hold:** Phases 2-4 until Phase 1 proves valuable in real use (1-2 months dogfood).

---

## 8. References

- Incident report: [supply-chain-incident-2026-05-12.md](supply-chain-incident-2026-05-12.md)
- Pattern doc: [multi-agent-decision-pattern.md](multi-agent-decision-pattern.md)
- Architectural anchor: [PILLARS.md](../core/PILLARS.md) — Guards pillar
- Constraint anchor: [ADR-0001](../decisions/0001-v2-pragmatic-lean.md) — cut-50%, Won't Contain list
- Related deferred: [ADR-0003](../decisions/0003-pillar-6-janitors.md) — could overlap with reactive cleanup, but Guards is preventive
- Inspirations: [Socket.dev](https://socket.dev), [Snyk](https://snyk.io), [StepSecurity Harden-Runner](https://www.stepsecurity.io)

---

**Status: SUPERSEDED by Section 10 (Final Synthesis — Path A Accepted, ADR-0005 finalized 2026-05-12). Sections 1-8 retained as design context. Sections 9-10 are canonical current state. Section 11 retained as historical voter-feedback round 1 capture.**

---

## 9. Voter Feedback (Multi-Agent Decision Pattern, 3 rounds + GVC, 2026-05-12)

**For full raw voter outputs see [sc-guard-voter-panel-r3.md](sc-guard-voter-panel-r3.md).**

### Aggregate tally (8 voters total)

| Verdict | Count | Voters |
|---|---|---|
| A: Ship aggressive 12h v1.3.5 | 1 high-conf | Goal/Value Champion (GVC) |
| B: Mid-scope 6-8h v1.4.x | 5 | Enterprise TL, OSS, Strategic, Risk, DA refined |
| C: Ultra-narrow 3-4h | 0 (DA R1 superseded) | — |
| D: Defer | 1 | Solo Dev |

### Why TechLead overrode B-consensus to adopt A

Two reframes the 5 B-voters did not have access to when voting:

1. **Bug 5 — Effort-anchoring bias**: Panel default-framed effort as fixed human linear work. GVC applied AI-augmented capacity multiplier (3-5x) per dw-kit's own thesis. "12h human-equivalent ≈ 3-4h TL time" → 1-week ship is **deliberate, not panic**. B-voters' "panic timing" objection was conditional on human-effort assumption.

2. **TW6 — Public sunset commitment as discipline marker**: GVC's key tweak — bake 90-day sunset metric publicly into ADR + release blog. This converts "panic ship" critique into "disciplined experiment with kill-switch", neutralizing DA's last rationalization-risk flag. B-voters assumed sunset was internal-only.

### Final 6 tweaks integrated

| # | Source | Tweak | TL time |
|---|---|---|---|
| TW1 | OSS + Strategic | Pre-announce blog/X post within 7 days (claim narrative) | ~30 min |
| TW2 | Enterprise TL | Pin feed snapshot SHA + audit trail in events.jsonl (feed-version + advisory-id) | ~20 min |
| TW3 | Risk/Operational | `dw doctor` health check fail-loud if stale >7d or schema mismatch | ~15 min |
| TW4 | Enterprise TL | Sunset metric includes false-positive rate (not just catch count) | ~10 min |
| TW5 | Solo Dev | Opt-in OFF default for `solo` preset | ~10 min |
| **TW6** | **GVC** | **Public sunset commitment in ADR + release blog → disciplined-experiment narrative** | ~15 min |

### Solo Dev D-vote response

Solo Dev's "feature not for solo audience" concern is independent of effort and remains valid. Addressed by TW5 (opt-in OFF default for solo preset). Solo dev users see zero impact unless they explicitly opt in.

---

## 10. Final Synthesis (Path A Accepted)

### Decision

**Adopt Verdict A: Ship full scope as dw-kit v1.3.5 in 7-10 days, with 6 integrated tweaks.** Authority: TechLead override of panel consensus B based on:

- Bug 5 (effort-anchoring) identified as structural panel bias
- GVC effort reframe (AI-augmented capacity) collapses "panic timing" objections
- TW6 (public sunset commitment) converts urgency to discipline
- 3/3 DA's strongest objections already conceded across rounds (bus-factor, ADR-0001 alignment, AI-specific risk)
- Cost-of-inaction (category-definition window ~10 days, competitor moat capture risk) outweighs preserved-budget gain

### Effort breakdown (AI-augmented TL time)

| Component | Human-baseline (orig est) | TL time (AI-augmented) |
|---|---|---|
| Hook + scanner core | 4-6h | ~45 min |
| OSV + GHSA auto-sync adapter | 2-3h | ~30 min |
| CLI `dw security-scan` | 1.5h | ~20 min |
| `dw doctor` section + telemetry events | 1.5h | ~15 min |
| Tests + smoke + docs | 1.5h | ~30 min |
| 6 tweaks (TW1-TW6) | 1.5h | ~100 min |
| **TOTAL TL time** | 12-14h human | **~4-5h TL** |

### Timeline

| Day | Action |
|---|---|
| Day 1-2 (2026-05-13/14) | Pre-announce blog draft + ADR-0005 finalize + scaffold task folder |
| Day 3-5 | Implement core: hook + adapter + CLI (parallel with Claude Code scaffold) |
| Day 6 | Implement 6 tweaks: audit trail, doctor health, sunset metric, solo opt-in, sunset commitment in ADR/blog |
| Day 7 | Tests + docs + dry-run on dw-kit's own lockfile |
| Day 8-9 | TL review + blog post finalize + npm publish v1.3.5 + GitHub release notes |
| Day 10 | Public announcement (blog/X) + team broadcast |
| 90 days later (2026-08-12) | Sunset review: ≥1 real catch + FP rate ≤5% OR retire silently per TW6 |

### Out-of-scope (defer to v1.4.x or v2.0)

- Dashboard tile / freshness heuristic — defer to v2.0 (panel correctly flagged scope creep)
- Multi-lockfile support (pnpm/yarn beyond npm) — assess at 90-day review
- IoC pattern matching at AST level — defer indefinitely

### Public sunset commitment text (TW6 draft, finalize in ADR/blog)

> "dw-kit v1.3.5 ships an experimental AI-native supply-chain guard. We commit to a 90-day review (target 2026-08-12): if telemetry shows zero real-world catches OR false-positive rate exceeds 5%, the feature is retired silently in v1.4.x. We will publish the review results regardless of outcome."

This commitment is non-rhetorical — telemetry events from TW2 (feed-version, advisory-id, block/allow) produce machine-readable evidence for the review.

### ADR-0005

Drafted as Accepted status. See [.dw/decisions/0005-supply-chain-guard.md](../decisions/0005-supply-chain-guard.md).

### Implementation task

Scaffolded at [.dw/tasks/sc-guard-v1.3.5/](../tasks/sc-guard-v1.3.5/) with v2 format (spec.md + tracking.md).

### Pre-announce blog draft

For TechLead review at [.dw/research/sc-guard-launch-blog-draft.md](sc-guard-launch-blog-draft.md).

---

## 11. Voter Feedback (Round 1 — original capture, preserved for audit)

### Run summary

Pattern dogfood applied to evaluate this proposal. Spawned 2 research + 6 voter agents in parallel from main thread (Bug 1 fix applied — main-thread orchestrate, not nested). Result:

| Agent | Status |
|---|---|
| Research A (dw-thinking) | "Completed" but no file written (only intro printed) |
| Research B (plain) | AUP-blocked |
| Voter Solo Dev | AUP-blocked |
| Voter Enterprise TL | AUP-blocked |
| Voter OSS Maintainer | AUP-blocked |
| Voter Maintainer-Burden | AUP-blocked |
| Voter Risk/Security | AUP-blocked |
| **Voter Devil's Advocate** | **PASSED** — sole-completed |

**Lesson**: 7/8 voter briefs paste threat detail (IoC, exfil domains, malware capabilities) → triggered AUP "violative cyber content" classifier. DA prompt naturally structured AGAINST the security feature → low threat-terminology → passed. This is now documented as **Bug 4** in [multi-agent-decision-pattern.md](multi-agent-decision-pattern.md) §3. Pattern fix: brief = role + lens + file paths only; threat context lives in artifact files (defender perspective).

### Devil's Advocate verdict (high signal — sole-completed voter)

**Independent verdict:** Defer | **Vote on proposal:** MODIFY | **Confidence:** medium

**REJECT case (DA's strongest arguments — captured for posterity):**

> "Đây là classic incident-response panic build — TanStack worm 19:20-19:26 UTC một ngày, dw-kit chưa từng bị, team chưa từng install trong window, và 'lucky' được dùng làm cớ ship 14-18h code. IoC bundle là **forever maintenance debt** (bus-factor = huydv solo) chạy đua với attacker novelty — zero-day vẫn slip, sophisticated attacker đọc bundle để né, false sense of safety tệ hơn không có. Phase 1 alone không deliver core value (no hook, no doctor) → MVP = vanity ship; phải tới Phase 2-3 mới hữu dụng, tức 11-14h thật, không phải 6-8h. Và 80% protection thực tế đến từ 1 command (`npm config set ignore-scripts true`) + broadcast template — đã free, đã ship. Coding 14-18h cho marginal 20% còn lại trong khi ADR-0001 cut-50% và v2.0 deadline 2026-08-15 đang treo = **đi ngược lean**, fits 'embedded engine' category PILLARS.md cảnh báo. Marketing-positive framing trong doc (#5 Pros) là tell-tale sign rationalizing."

**Rebut DA self-conceded to flip Defer→MODIFY:**

> "Post-install scan ở Claude Code Edit-lockfile hook **là** structural workflow integration không trùng `ignore-scripts`. Nhưng chỉ value khi scope cực hẹp — IoC bundle TanStack-only như reference fixture, không community-curated forever-bundle."

### DA's concrete TWEAK (proposal cut 75%)

| Component | Original | DA's MODIFY |
|-----------|----------|-------------|
| Effort | 14-18h (Phase 1: 6-8h) | **3-4h total** |
| CLI `dw security-scan` | Yes | **NO** |
| `dw doctor` security section | Yes | **NO** |
| Canonical repo `dw-kit-ioc-bundle` | Yes | **NO** — single JSON commit-pinned in repo |
| `--update-db` fetch | Yes | **NO** |
| Freshness heuristic | Yes | **NO** |
| Hook `.claude/hooks/supply-chain-scan.sh` (greps IoC pattern when Claude Edits lockfile) | Yes | **Yes — only shipped component** |
| Sunset rule | None | **Revisit 90 days; if 0 hits → retire** |

**DA's key risk:** "IoC bundle bus-factor — huydv quit/busy 3 tháng → stale DB ships false confidence, tệ hơn không guard."

### Status: DEFERRED

Per TechLead decision (2026-05-12), this proposal is **deferred** pending:

1. Direct TechLead review of full proposal + DA tweak (not delegated to multi-agent voting due to Bug 4)
2. v1.4 ship completion (target 2026-06-30) — supply-chain guard cannot compete with v1.4 critical path
3. Optional: retry voting with reframed prompts per Bug 4 fix if multi-perspective input desired

**No ADR-0005 drafted at this time.** Proposal frozen with DA tweak captured for future re-evaluation.

### Pattern run learnings (for future reuse)

- Multi-agent pattern works for non-sensitive topics (Bayesian case ran clean)
- Security topics need topic-neutral brief reframe (Bug 4 fix)
- Devil's Advocate role provides 80% of signal when applied right — even single DA voter delivered concrete actionable tweak
- "Recover blocked voters" was offered as Option B but rejected — DA signal was sufficient + Bug 4 was the actual outcome of interest
