<!-- dw-kit | core: 1.2 -->
# dw Skills

Invoke via Claude Code slash commands. Availability governed by config flags and `workflow.default_depth`.

## Core Workflow

| Skill | Description | Depth |
|-------|-------------|-------|
| `/dw-flow [task]` | Full workflow shortcut | all |
| `/dw-task-init [name]` | Init task docs | all |
| `/dw-research [name]` | Survey codebase | all |
| `/dw-plan [name]` | Design plan (waits for approval) | standard+ |
| `/dw-execute [name]` | Implement per plan (TDD) | all |
| `/dw-commit [msg]` | Smart commit + quality gates | all |
| `/dw-handoff` | Session handoff | all |

## Dev

| Skill | Description |
|-------|-------------|
| `/dw-debug [issue]` | Investigate → diagnose → fix |
| `/dw-review` | Code review with checklist |
| `/dw-thinking [question]` | Apply thinking framework |
| `/dw-prompt [desc]` | Build structured prompt |
| `/dw-docs-update` | Update living docs |

## Role-Specific

| Skill | Role | Description |
|-------|------|-------------|
| `/dw-requirements` | BA | Requirements + user stories |
| `/dw-test-plan` | QC | Test plan + regression |
| `/dw-arch-review` | TechLead | Architecture review |
| `/dw-dashboard` | PM | Metrics report |
| `/dw-sprint-review` | All | Retrospective |
| `/dw-estimate [name]` | if enabled | Effort estimation |
| `/dw-log-work [name]` | if enabled | Log actual effort |

## Setup & Maintenance

| Skill | Description |
|-------|-------------|
| `/dw-onboard` | Onboard dw to existing project (breadth-first scan) |
| `/dw-retroactive [name]` | Document existing feature (depth-first) |
| `/dw-config-init` | Initialize new config |
| `/dw-config-validate` | Validate config file |
| `/dw-upgrade` | Upgrade toolkit |
| `/dw-rollback [name]` | Rollback task docs |
| `/dw-archive [name]` | Archive completed task |
| `/dw-kit-report [desc]` | Submit feedback/bug to GitHub |

> **Maintainer-only** (TechLead, dw-kit repo): `/dw-kit-evolve [issue#]` · `/dw-kit-audit [days]`
