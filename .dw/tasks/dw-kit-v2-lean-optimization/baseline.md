# Baseline Measurement — dw-kit v1.2.1

## Captured: 2026-04-21
## Purpose: Reference for v2.0 success criteria verification

---

## File Counts

```bash
$ find .claude -type f | wc -l
61

$ find .dw -type f | wc -l
55

Total: 116 files
```

## Rules Injection (auto-loaded into every session)

```
 1503  .claude/rules/code-style.md
 1098  .claude/rules/commit-standards.md
 2746  .claude/rules/dw-core.md
 2032  .claude/rules/dw-skills.md
 2682  .claude/rules/workflow-rules.md
 1261  CLAUDE.md
-----
11322  total bytes (~11.3 KB)
```

## Hooks (8 total)

| Hook | Trigger | Purpose |
|------|---------|---------|
| scout-block.sh | PreToolUse Read/Glob | Block node_modules/dist/.git reads |
| privacy-block.sh | PreToolUse Read | Block .env/credentials/keys |
| session-init.sh | UserPromptSubmit | Inject active task context |
| pre-commit-gate.sh | PreToolUse Bash(git commit) | Quality check + sensitive scan |
| safety-guard.sh | PreToolUse Bash | Block destructive commands |
| post-write.sh | PostToolUse Write/Edit | Lint reminder |
| stop-check.sh | Stop | Warn on uncommitted changes |
| progress-ping.sh | (unclear) | Progress tracking |

## Skills (29 total)

See `.claude/skills/` directory listing. Categories:
- Core workflow: dw-flow, dw-task-init, dw-research, dw-plan, dw-execute, dw-commit, dw-handoff
- Dev: dw-debug, dw-review, dw-thinking, dw-prompt, dw-docs-update
- Role-specific: dw-requirements, dw-test-plan, dw-arch-review, dw-dashboard, dw-sprint-review
- Setup: dw-onboard, dw-retroactive, dw-config-init, dw-config-validate, dw-upgrade, dw-rollback, dw-archive
- Optional: dw-estimate, dw-log-work
- Maintainer: dw-kit-evolve, dw-kit-audit, dw-kit-report
- Base: init, claude-api

## Task Docs Format (v1.x)

```
.dw/tasks/{task-name}/
├── {task-name}-context.md   # Research findings
├── {task-name}-plan.md      # Implementation plan
└── {task-name}-progress.md  # Progress + handoff
```

3 files per task. Required for standard+ depth.

## Success Criteria Deltas

| Metric | Baseline | v2.0 Target | Delta Required |
|--------|----------|-------------|----------------|
| Auto-loaded context (bytes) | 11,322 | ≤5,661 | ≥50% reduction |
| File count (.claude + .dw) | 116 | ≤70 | ≥40% reduction |
| Hooks | 8 | ~3-4 | Data-driven cut |
| Skills | 29 | ~7-10 | Data-driven cut |
| Task doc files per task | 3 mandatory | 2 default (spec + tracking) | Structural |

## Re-measurement Protocol

Run this command at end of each phase:

```bash
echo "Files:" && find .claude -type f | wc -l && find .dw -type f | wc -l
echo "Rules bytes:" && wc -c .claude/rules/*.md CLAUDE.md 2>/dev/null | tail -1
echo "Hooks:" && ls .claude/hooks/ | wc -l
echo "Skills:" && ls .claude/skills/ | wc -l
```

Commit results to `baseline-v1.3.md`, `baseline-v1.4.md`, `baseline-v2.0.md` for audit trail.
