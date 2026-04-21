# dw-kit (repo)

Workflow toolkit codebase. Rules live in `.claude/rules/` (auto-loaded).

**v2.0 direction:** Context-First SDLC Governance Layer (5 pillars — see `.dw/core/PILLARS.md`)
**Current:** v1.4.0-dev · v1.3.0 ready to ship · ADR-0001 active

---

## Tech Stack

- Runtime: Node.js ≥18, ESM (`.mjs`)
- CLI: `commander` · UI: `enquirer`, `chalk` · Config: `js-yaml`, `ajv`
- Tests: `node src/smoke-test.mjs`

## Repo Structure

```
bin/          CLI entrypoint
src/
  commands/   CLI subcommands (init, upgrade, dashboard, metrics, ...)
  lib/        Shared utilities (config, telemetry, active-index, ...)
.claude/
  hooks/      Bash hooks (Guards pillar)
  rules/      dw.md (consolidated) + code-style + commit-standards
  skills/     Slash commands with dw:* namespace
.dw/
  core/       WORKFLOW · THINKING · QUALITY · ROLES · PILLARS · templates/
  decisions/  ADRs (Records pillar)
  tasks/      Active + archive/ (Bridges pillar — via tracking.md)
  metrics/    Local telemetry (events.jsonl)
  config/     dw.config.yml
```

## Dev Notes

- All source ESM — no CommonJS
- `TOOLKIT_ROOT` resolved from `import.meta.url` in each command
- Hooks python3-free (node only — Windows compat)
- `dw-kit-evolve` + `dw-kit-audit` are maintainer-only — excluded from npm package
- Published package files declared explicitly in `package.json#files`
- Telemetry local-only, `DW_NO_TELEMETRY=1` to disable
