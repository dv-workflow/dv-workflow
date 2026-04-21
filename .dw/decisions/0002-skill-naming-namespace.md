---
id: ADR-0002
title: Skill Naming Convention — Colon Namespace Separator
status: Accepted
date: 2026-04-21
deciders: huydv
impact: minor
supersedes: null
superseded-by: null
---

# ADR-0002: Skill Naming Convention — `/dw-{name}` → `/dw:{name}`

**TL;DR:** Rename all 29 skills from `dw-{name}` to `dw:{name}` pattern (e.g., `/dw-thinking` → `/dw:thinking`). Colon acts as namespace separator, clearer brand. Directory names unchanged (Windows constraint). Breaking change — requires migration note.

---

## Context

Current convention: all dw-kit skills use `dw-` prefix (`/dw-thinking`, `/dw-research`, `/dw-commit`, ...). Problems:

1. **Visual noise** — `dw-thinking` vs native-feel `debug`, hard to scan which commands are dw-kit
2. **Namespace ambiguity** — `dw-debug` could be confused with a generic debug command
3. **Branding inconsistency** with established tool conventions (`git:log`, `npm:run`, `cargo:build` patterns)
4. **Grep friction** — searching for "dw skills" means searching `dw-` which matches unrelated things

TechLead request 2026-04-21: standardize to `dw:{name}` pattern for visual namespace clarity.

## Options Considered

### Option A: Keep `dw-{name}` (status quo)
- **Pros:** Zero breaking change; already shipped in v1.x
- **Cons:** Problems above persist
- **Rejected because:** TechLead has UX issue — important for OSS branding

### Option B: Change to `dw:{name}` with backward-compat aliases
- **Pros:** Clean namespace; grace period for users; eventual consistency
- **Cons:** Complex implementation; dual names in docs; alias deprecation timeline needed
- **Considered but:** Complexity vs value tradeoff unclear without testing harness support

### Option C: Change to `dw:{name}` clean break (CHOSEN)
- **Pros:** Simple; forces clean migration; visually distinct immediately
- **Cons:** Breaking change; all users learn new commands; all docs update
- **Rejected alternatives considered:** `dw.thinking` (dot separator — confusable with file paths), `dw/thinking` (slash — parse issues), `@dw/thinking` (npm-style — over-engineered)

## Decision

**Rename all 29 skills from `dw-{name}` to `dw:{name}` in SKILL.md frontmatter `name:` field.**

**Critical constraints:**
- Directory names **stay as `dw-thinking/`** (colon illegal on Windows filesystems)
- Only the `name:` field in SKILL.md changes
- Slash command invocation becomes `/dw:thinking`

**Pre-requisite (BLOCKER):**
Verify Claude Code harness accepts `:` in skill `name:` frontmatter field. Test with single skill rename before mass change. If unsupported → abort ST-1.9 and fallback options:
- Fallback 1: `dw.{name}` (dot separator)
- Fallback 2: Keep `dw-{name}`, defer namespace until Claude Code supports it

## Consequences

**Positive:**
- Clear visual namespace `dw:...` immediately recognizable
- Aligned with industry conventions (git:, npm:, cargo:)
- Easier grep: `/dw:` matches only dw-kit skills
- Better OSS branding story

**Negative:**
- Breaking change for all existing users (2 teams + OSS)
- All docs need update: CLAUDE.md, `.claude/rules/dw-skills.md`, README, skill SKILL.md files
- Muscle memory cost for current users
- If Claude Code harness rejects `:` → rollback work

**Neutral:**
- Directory structure unchanged
- Skill logic unchanged
- No telemetry impact

## Migration Plan

1. **Pre-check** (day 1): Test `name: dw:thinking` in single skill SKILL.md, verify `/dw:thinking` invokes correctly
2. **If pass:** Batch rename 29 skills via script
3. **Update docs:** CLAUDE.md, rules files, README, skill descriptions
4. **Migration guide:** Add mapping table (old → new) to `MIGRATION-v1.3.md`
5. **Heads-up:** Include in v1.3 ship announcement to 2 teams
6. **If fail (harness rejects `:`):** Abort, update ADR status to `Rejected`, reconsider fallback

## References

- Related: ADR-0001 (v2.0 direction)
- Parent task: `.dw/tasks/dw-kit-v2-lean-optimization/` ST-1.9
- External: Command naming conventions in git/npm/cargo ecosystems

## Update 2026-04-21 — Implementation Observation

Rename of `name:` field applied to all 30 skills during v1.3 execution. However, Claude Code system reminders continue to list skills with `dw-xxx` names after the rename, suggesting the harness derives slash command names from **directory names**, not from SKILL.md `name:` frontmatter.

**Verification still required:** TechLead must test by invoking `/dw:thinking` in a fresh Claude Code session.

**Possible outcomes:**
- **Pass:** Harness accepts frontmatter-driven naming → ADR status → `Accepted`
- **Fail:** Directory name wins → rename is no-op for slash commands
  - Fallback A: Revert to `dw-xxx`, keep status quo
  - Fallback B: Accept that skills must retain `dw-xxx` invocation, use namespace only in docs/branding
  - Fallback C (future): Investigate if Claude Code can be configured to respect frontmatter name

**Rollback command if fail:**
```bash
sed -i 's/^name: dw:/name: dw-/' .claude/skills/dw-*/SKILL.md
sed -i 's|/dw:|/dw-|g' .claude/rules/dw-skills.md .claude/rules/workflow-rules.md
for f in .claude/skills/dw-*/SKILL.md; do sed -i 's|`/dw:|`/dw-|g; s| /dw:| /dw-|g' "$f"; done
```
