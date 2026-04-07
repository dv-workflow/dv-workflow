# dw-kit (repo)

Workflow toolkit codebase. dw rules live in `.claude/rules/` — auto-loaded by Claude Code.

Config: `.dw/config/dw.config.yml`

---

## Tech Stack

- Runtime: Node.js ≥18, ESM (`.mjs`)
- CLI: `commander` · UI: `enquirer`, `chalk` · Config: `js-yaml`, `ajv`
- Tests: `node src/smoke-test.mjs`

## Repo Structure

```
bin/          CLI entrypoint
src/
  commands/   CLI subcommands (init, upgrade, validate, ...)
  lib/        Shared utilities (config, copy, ui, ...)
.claude/
  hooks/      Bash hooks — python3-free, node only (Windows compat)
  rules/      dw-core.md + dw-skills.md (auto-loaded by Claude Code)
  skills/     Slash command definitions
  templates/  Agent report template
.dw/
  core/       WORKFLOW.md, THINKING.md, QUALITY.md, ROLES.md
  config/     dw.config.yml for this repo
  tasks/      Active task docs
```

## Dev Notes

- All source ESM (`import`/`export`) — no CommonJS
- `TOOLKIT_ROOT` resolved from `import.meta.url` in each command
- Hooks use `node` for JSON parsing (not python3 — Windows compat)
- Skills `dw-kit-evolve` and `dw-kit-audit` are maintainer-only — excluded from npm package
- Published package files declared explicitly in `package.json#files`
