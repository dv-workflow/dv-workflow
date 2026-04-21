# v1.4 Evaluation Protocol

> How to decide what to cut in v1.4, based on telemetry evidence from v1.3 in production.
> Anchored to [ADR-0001](../decisions/0001-v2-pragmatic-lean.md) Cut Criteria Matrix.

---

## Purpose

Prove dw-kit can **cut itself** when data says so — validates the "not a framework cage" principle and grows organizational memory via ADRs.

## Timeline

| Phase | Dates | Activity |
|-------|-------|----------|
| Prep | Week 0 | v1.3.0 published + installed on all teams |
| Collect | Week 1–4 | Normal use; telemetry accumulates locally per dev |
| Aggregate | End of Week 4 | Each dev exports `.dw/metrics/events.jsonl`, TechLead merges |
| Analyze | Week 5 (day 1–2) | Run `dw metrics cut-analysis` on merged data |
| Survey | Week 5 (day 2–3) | Team survey on flagged items (qualitative check) |
| Decide | Week 5 (day 4) | ADR per confirmed cut |
| Execute | Week 5 (day 5) | Remove files + settings + write MIGRATION-v1.4.md |
| Ship | Week 6 | v1.4.0 release |

## Evaluation Steps

### 1. Collect (end of week 4)

Each dev runs:
```bash
cp .dw/metrics/events.jsonl ~/dw-metrics-<dev-name>.jsonl
```

TechLead merges into a single evaluation workspace:
```bash
mkdir -p ~/dw-v14-eval/.dw/metrics
cat ~/dw-metrics-*.jsonl > ~/dw-v14-eval/.dw/metrics/events.jsonl
```

### 2. Analyze

```bash
cd ~/dw-v14-eval
dw metrics cut-analysis --since 2026-05-12
```

Output flags skills/hooks qualifying per [ADR-0001 Cut Criteria](../decisions/0001-v2-pragmatic-lean.md):

- **Skill**: `uses/week/dev < 5` AND `devs ≥ 5` AND `coverage_days ≥ 21`
- **Hook**: `avg_latency > 500ms` OR `fires/session > 10`

**Caveat**: session-hash proxy undercounts real headcount. If flagged count is borderline → lean keep.

### 3. Survey (qualitative gate)

For each flagged item, ask the team:

1. Did you use `/dw:{name}` in the last 4 weeks?
2. If removed, would you miss it? (1=no / 5=yes)
3. Any use case that telemetry wouldn't capture?

**Cut only if**: telemetry flags AND <30% of devs answer ≥4 on question 2.

### 4. Decide (per cut)

For each confirmed cut:

```bash
/dw:decision "Remove {hook-or-skill-name}"
```

ADR must include:
- Evidence: uses/week/dev, fires/session, latency (paste from `cut-analysis`)
- Survey result
- Rollback plan (git revert SHA + how to reinstate)
- Supersedes line if any prior ADR protected this item

### 5. Execute

For each cut:
- Delete `.claude/hooks/{name}.sh` or `.claude/skills/dw-{name}/`
- Remove entry from `.claude/settings.json` hooks block
- Remove from `package.json#files` if listed
- Add row to `MIGRATION-v1.4.md` with "What changed / Why / Rollback"

### 6. Ship

- Version bump: `1.3.x → 1.4.0`
- Split commits: one per cut + one for MIGRATION doc
- `npm publish`
- Announce to teams with link to MIGRATION-v1.4.md and relevant ADRs

## Protected Items (never cut in v1.4)

**Critical-path skills** (workflow load-bearing):
`dw:flow`, `dw:task-init`, `dw:commit`, `dw:handoff`, `dw:execute`, `dw:plan`, `dw:research`, `dw:thinking`, `dw:review`, `dw:debug`, `dw:decision`

**Per-project skills** (low cadence is expected):
`dw:onboard`, `dw:retroactive`, `dw:config-init`, `dw:upgrade`, `dw:rollback`

If any flagged by matrix → override is "keep" with a 1-line note in the analysis report.

## Failure Modes

| Failure | Mitigation |
|---------|------------|
| <21 days coverage | Postpone v1.4, extend collection window |
| <5 unique sessions | Insufficient data; wait or onboard more devs to v1.3 |
| Data merge error | Each jsonl is self-contained; re-merge from backups |
| Team disagrees with data | Qualitative survey overrides; document in ADR |
| Post-cut regret | Execute rollback plan from ADR; issue v1.4.1 patch |

## Success Signals

- ≥2 ADRs written (shows data-driven cuts happened, not just "feels right")
- Auto-loaded rules bytes ↓ ≥30% from v1.3 baseline ([baseline.md](../tasks/dw-kit-v2-lean-optimization/baseline.md))
- Team NPS for dw-kit ≥ v1.3 level (cuts didn't hurt workflow)
- Zero rollback in first 2 weeks post-v1.4
