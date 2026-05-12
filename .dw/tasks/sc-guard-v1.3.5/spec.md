---
task_id: sc-guard-v1.3.5
created: 2026-05-12
status: Approved
owner: huydv
depth: standard
related_adr: ADR-0005
target_ship: 2026-05-19
---

# Spec: AI-Native Supply-Chain Guard (dw-kit v1.3.5)

## Intent

Ship dw-kit v1.3.5 with an AI-Native Supply-Chain Guard wired into Claude Code workflow at the Edit-lockfile boundary. Hook + OSV/GHSA auto-sync adapter + CLI + doctor health check + telemetry — full scope per ADR-0005. Public 90-day sunset commitment (review 2026-08-12) as discipline marker.

**Differentiator:** Snyk/Socket/OSV-scanner all assume human-authored lockfiles. dw-kit assumes AI agents author lockfile edits — and intercepts at that boundary. First tool to own this positioning.

## Why Now

- **Category-definition window** closes ~10 days post-2026-05-11 incident; competitor (VC-funded) likely claims AI-Native Guard space within 90 days if not first
- **Incident demonstration value** for 2 dev teams — concrete capability shown right when v2.0 adoption depends on team trust
- **AI-augmented capacity** makes ~5h TL time feasible (~12h human-baseline compressed via Claude Code scaffold + existing pattern reuse)
- **Multi-agent voter panel** (8 voters across 3 rounds + GVC) stress-tested decision; TechLead override of B-consensus documented per Bug 5 framing

## Scope

### In Scope

**ST-1: Hook on Edit-lockfile**
- Create `.claude/hooks/supply-chain-scan.sh`
- Trigger: Claude Code Edit/Write of `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`
- Runs `dw security-scan --quick` (offline IoC + advisory snapshot check)
- Acceptance: hook fires on lockfile edit, exits 0 on clean, 1 on warning, 2 on critical IoC match
- Effort: ~45 min TL time

**ST-2: OSV.dev + GHSA auto-sync adapter**
- Create `src/lib/sc-sync.mjs`
- Read-only fetch from OSV.dev REST API + GitHub Security Advisories (via `gh api`)
- Snapshot to `.dw/security/advisory-snapshot.json` with feed-version + fetch-timestamp + SHA pin
- Acceptance: `dw security-scan --update-db` produces valid snapshot; manual fetch works offline-after
- Effort: ~30 min

**ST-3: Core scanner**
- Create `src/lib/sc-scanner.mjs`
- Parse npm/pnpm/yarn lockfiles
- Cross-reference deps with advisory snapshot
- Output: matched vulnerabilities with severity + advisory-id + fix-version
- Acceptance: scans dw-kit's own lockfile, returns matches for known historical CVEs in dependency tree
- Effort: ~30 min

**ST-4: CLI command**
- Create `src/commands/security-scan.mjs`
- `dw security-scan` (default), `--quick` (no network), `--json`, `--update-db`
- Wire into `src/cli.mjs`
- Acceptance: smoke test passes; integrates with existing CLI patterns
- Effort: ~20 min

**ST-5: `dw doctor` security section (TW3)**
- Add to `src/commands/doctor.mjs`
- Show: last sync timestamp, feed schema version, snapshot age
- **Fail loud** if snapshot >7 days stale OR schema mismatch
- Acceptance: `dw doctor` shows new section with health status
- Effort: ~15 min

**ST-6: Telemetry events (TW2)**
- Extend `src/lib/telemetry.mjs` event schema
- Events: `sc_guard.scan_run`, `sc_guard.block`, `sc_guard.allow`, `sc_guard.sync`
- Each event includes: feed-version, advisory-id (if applicable), outcome
- Acceptance: events appear in `.dw/metrics/events.jsonl` after scan
- Effort: ~15 min

**ST-7: Solo preset opt-in OFF (TW5)**
- Update `src/commands/init.mjs` PRESETS
- `solo` preset: `sc_guard.enabled: false` (default)
- `team` and `enterprise`: `sc_guard.enabled: true`
- Acceptance: `dw init --solo` produces config with sc_guard disabled
- Effort: ~10 min

**ST-8: Pre-announce blog post (TW1)**
- Draft at `.dw/research/sc-guard-launch-blog-draft.md`
- Position: AI-Native Supply-Chain Guard
- Include: TW6 public sunset commitment text
- Acceptance: TL reviews, approves for publication
- Effort: ~30 min

**ST-9: ADR sunset commitment text (TW6)**
- Already included in [ADR-0005 §"Public Sunset Commitment Text"](../../decisions/0005-supply-chain-guard.md)
- Cross-reference from blog post
- Acceptance: text in ADR + blog + release notes consistent
- Effort: ~15 min (review only)

**ST-10: Tests + smoke + docs**
- Extend `src/smoke-test.mjs` with sc_guard cases
- Add 1 section to CLAUDE.md + README
- Acceptance: 25+ smoke tests pass; docs link to ADR-0005
- Effort: ~30 min

**ST-11: Release v1.3.5**
- Bump package.json 1.3.4 → 1.3.5
- Add files to package.json#files (hook + lib + command + security dir)
- npm publish
- GitHub release notes
- Acceptance: `npm install dw-kit@1.3.5` works on fresh project
- Effort: ~20 min

**ST-12: Public announcement**
- Blog post live
- X/HN announcement
- Team broadcast (Slack/email)
- Acceptance: post live, 1+ inbound link tracked
- Effort: ~30 min

### Out of Scope (Won't Contain)

- Dashboard tile / freshness heuristic (defer v2.0)
- PyPI / Go / Cargo lockfile support (defer indefinitely per ADR-0001 Won't Contain)
- Curated IoC bundle / canonical `dw-kit-ioc-bundle` repo (REPLACED by OSV/GHSA auto-sync)
- Manual `--update-db` flag separate from auto-sync
- AST-level IoC pattern matching
- Multi-dev sharing of advisory snapshots

## Timeline

| Phase | Duration | Target Date |
|-------|----------|-------------|
| Day 1: ADR finalize + blog draft + scaffold | 1h | 2026-05-13 |
| Day 2-3: Hook + adapter + scanner core | 2h | 2026-05-14 |
| Day 4: CLI + doctor + telemetry | 1h | 2026-05-15 |
| Day 5: Tweaks (TW1-TW6 integration) | 1h | 2026-05-16 |
| Day 6: Tests + docs + smoke + dry-run | 30min | 2026-05-17 |
| Day 7-8: TL review + blog finalize | 30min | 2026-05-18 |
| Day 9: npm publish v1.3.5 | 20min | 2026-05-19 |
| Day 10: Public announce | 30min | 2026-05-20 |

**Total TL time: ~5h** (hard cap; abort if exceeded — per ADR-0005 N1).

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| TL time exceeds 5h cap | High | Hard abort per N1 — retire from v1.3.5, revisit v1.4.x |
| OSV/GHSA API unavailable | High | N2 — cannot ship without auto-sync (re-introduces bus-factor) |
| Hook regression on existing dw-kit users | Medium | TW5 (opt-in OFF default for solo) + opt-in flag for first ship |
| Schema drift OSV/GHSA upstream | Medium | TW3 fail-loud health check in `dw doctor` |
| False-positive spam in scans | Medium | TW4 FP rate metric (≤5%) in sunset review |
| Competitor ships AI-Native guard first | Medium | TW1 pre-announce blog within 7 days claims narrative early |
| Marketing claim doesn't hold up | Medium | Hook-on-Edit-lockfile is genuinely novel integration point |
| 90-day sunset shows 0 catches | Low | TW6 public commitment frames as deliberate experiment, not failure |

## Success Criteria

Measurable outcomes:

- [ ] All 12 STs complete within 5h TL time budget
- [ ] 25+ smoke tests pass (current 25 + new sc_guard cases)
- [ ] `dw security-scan` runs cleanly on dw-kit's own lockfile
- [ ] `dw security-scan` detects ≥1 known historical CVE in dep tree (validates scanner correctness)
- [ ] Hook fires correctly on Edit-lockfile event in Claude Code session
- [ ] npm publish v1.3.5 succeeds; install on fresh project works
- [ ] Blog post live on day 9-10 (within 7-day pre-announce window)
- [ ] Public sunset commitment text appears in: ADR-0005 + blog + release notes (3 places consistent)
- [ ] 90-day review on 2026-08-12 published regardless of retain/retire outcome

## Dependencies

- **External:** OSV.dev REST API availability, GitHub Security Advisories accessible via `gh api`
- **Internal:** existing `src/lib/telemetry.mjs` schema (extends), `src/lib/active-index.mjs` patterns (reuse)
- **Tooling:** Claude Code Edit/Write tool hook event surface (existing)

## Known Unknowns (admitted gaps)

- OSV.dev API rate limits — to discover during impl
- GHSA feed schema version stability — pin version, verify per sync
- Hook trigger ordering when multiple lockfiles edited simultaneously
- Best CLI output format (default human-readable vs `--json`) — UX-tune during impl

## Acceptance (Task Complete When)

- [ ] All 12 STs marked Done in tracking.md
- [ ] All Success Criteria pass
- [ ] ADR-0005 marked Accepted, referenced from CLAUDE.md
- [ ] Blog post published
- [ ] Team broadcast sent
- [ ] npm v1.3.5 live
- [ ] Sunset review scheduled for 2026-08-12 (calendar reminder set)
