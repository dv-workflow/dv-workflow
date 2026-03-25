# Integration Guide (dw-kit v1)

This guide shows the current (v1) way to set up `dw-kit` in a project.

## 1) Install the CLI

```bash
npm install -g dw-kit
```

## 2) Initialize your project

Run from your project root:

```bash
dw init --preset small-team --adapter claude-cli
```

Then review the generated config:

```bash
dw validate
```

Key file: `.dw/config/dw.config.yml`

## 3) Customize team behavior (optional)

- Team overrides (upgrade-safe) go to: `.dw/adapters/claude-cli/overrides/`
- Net-new skills go to: `.dw/adapters/claude-cli/extensions/`

After changes, update toolkit files as needed:

```bash
dw upgrade
```

## 4) Start working in Claude Code

```text
/dw-flow my-feature
```

You can also use the step-by-step skills (`/dw-task-init`, `/dw-research`, `/dw-plan`, `/dw-execute`, ...).

## 5) Update to a newer dw-kit release

```bash
dw upgrade --check
dw upgrade --dry-run
dw upgrade
```

