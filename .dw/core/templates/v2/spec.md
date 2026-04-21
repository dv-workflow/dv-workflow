---
task_id: {task-name}
created: {YYYY-MM-DD}
status: Draft | Approved | In Progress | Done
owner: {name}
depth: quick | standard | thorough
related_adr: {ADR-XXXX | none}
target_ship: {YYYY-MM-DD | none}
---

# Spec: {Task Title}

## Intent

{1-2 paragraphs — what and why. No background padding.}

## Why Now

{Forcing function. Deadline, incident, dependency, opportunity.}

## Scope

### In Scope

**ST-1: {Subtask name}**
- {Concrete action}
- Acceptance: {verifiable criterion}
- Effort: {hours or days}

**ST-2: ...**

### Out of Scope (Won't Contain)

- {Explicit exclusions — prevents scope creep}

## Timeline (if ship target)

| Phase | Duration | Target Date |
|-------|----------|-------------|
| ... | ... | ... |

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| ... | H/M/L | ... |

## Success Criteria

Measurable outcomes (not vibes):

- [ ] {Numeric threshold, e.g., "latency <100ms p95"}
- [ ] {Binary gate, e.g., "passes smoke test"}

## Dependencies

- {Upstream blockers}
- {External systems}

## Known Unknowns (admitted gaps)

- {Question 1 — to resolve during execution}

## Acceptance (Task Complete When)

- [ ] {High-level criteria, e.g., "shipped to prod"}
- [ ] {Documentation updated}
- [ ] {Migration note added if breaking}
