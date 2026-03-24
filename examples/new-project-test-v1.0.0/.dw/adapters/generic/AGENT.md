# dw-kit Workflow — Generic Agent Instructions

> **For**: Cursor, Windsurf, Copilot Chat, or any AI coding assistant
> **Note**: This is a methodology reference. It cannot replicate Claude Code-specific features
> (agent delegation with tool constraints, hooks, MCP integration). For full capabilities, use the Claude CLI adapter.

---

## Setup

1. Copy this file to your project root as `AGENT.md` (or paste into your AI assistant's context)
2. Copy `.dw/config/dw.config.yml` to your project and fill in your settings
3. Create `.dw/tasks/` directory for task documentation

---

## Configuration

Read `.dw/config/dw.config.yml` for:
- `workflow.default_depth` — quick | standard | thorough
- `team.roles` — available team roles
- `quality.test_command`, `quality.lint_command` — quality gates
- `paths.tasks` — where task docs are stored

---

## Depth Routing

| Scope | Depth | Workflow |
|-------|-------|---------|
| ≤2 files, hotfix | quick | Understand → Execute → Close |
| 3-5 files | standard | All 6 phases |
| 6+ files, API/DB changes | thorough | All phases + arch review |

---

## Workflow Phases

### Phase 1: Initialize

Create task documentation at `{paths.tasks}/[task-name]/`:
```
[name]-context.md    # Research findings
[name]-plan.md       # Implementation plan
[name]-progress.md   # Progress tracking
```

**Before proceeding**: Task name defined, scope assessed, depth chosen.

### Phase 2: Understand (Research)

Explore the codebase:
- Find all files related to the task
- Map dependencies (upstream and downstream)
- Identify current patterns and conventions
- Check test coverage
- Note git history for recent changes in the area
- Document what is unclear

Fill in `[name]-context.md` with findings.

**Before proceeding**: All files identified, no critical unknowns.

### Phase 3: Plan

Design solution before writing any code:
- Consider ≥2 approaches with trade-offs
- Apply devil's advocate: strongest reason NOT to choose your preferred approach
- Break into subtasks (each ≤3 files, ≤4 hours, independent commit)
- Order: schema → service → API → tests → docs

Fill in `[name]-plan.md`.

**STOP**: Wait for human approval before executing.
If team has TL: TL must review architecture decisions.

### Phase 4: Execute

For each subtask:
1. Read acceptance criteria
2. Write tests first (failing) — RED
3. Implement to make tests pass — GREEN
4. Refactor if needed — REFACTOR
5. Update progress file
6. Commit: `type(scope): description`

**Rules**:
- Only work within subtask scope
- If ambiguous → stop and ask (don't guess for large changes)
- If scope changes → update plan, ask human

### Phase 5: Verify

**Self-review** (always):
- Logic correct? Edge cases handled?
- No debug code (console.log, debugger, etc.)
- No sensitive data (passwords, tokens, keys)

**Automated** (if configured):
```bash
{quality.test_command}
{quality.lint_command}
```

**Peer/TL review** (standard+):
- Architecture decisions reviewed
- Code review with checklist (see `.dw/core/QUALITY.md`)

**QA** (thorough + qc role):
- QA reviews against test plan
- Explicit sign-off required

### Phase 6: Close

Commit format:
```
<type>(<scope>): <description ≤72 chars>

Co-Authored-By: [AI assistant name]
```

Update progress file: status → Done.
If handing off: write handoff notes (done/in-progress/blocked, next steps).

---

## Standalone: Debug

When encountering a bug:
1. **Investigate**: Reproduce exactly. Gather evidence (error, stack trace, file:line).
2. **Diagnose**: Form hypothesis. Verify. Find root cause (not symptom).
3. **Fix**: Fix root cause. Test the fix. Check for regressions. Commit.

---

## Quality Principles

Full quality strategy: `.dw/core/QUALITY.md`

Key principles:
- Write tests before implementation (TDD)
- Each subtask = one commit
- Review checklist: correctness, security, performance, maintainability, tests
- CRITICAL issues must be fixed before merge

---

## Limitations of This Adapter

This generic adapter provides the **methodology** but cannot provide:

| Feature | Claude CLI Adapter | Generic Adapter |
|---------|-------------------|-----------------|
| Agent delegation (researcher/planner/reviewer) | ✅ | ❌ |
| Tool constraints (read-only research agent) | ✅ | ❌ |
| Pre-commit hooks (safety-guard, quality gates) | ✅ | ❌ |
| MCP server integration | ✅ | ❌ |
| Automatic progress tracking | ✅ | Manual |

For full capabilities, use Claude Code with the Claude CLI adapter.

---

## Full Methodology Reference

- Workflow phases: `.dw/core/WORKFLOW.md`
- Thinking framework: `.dw/core/THINKING.md`
- Quality strategy: `.dw/core/QUALITY.md`
- Role definitions: `.dw/core/ROLES.md`
