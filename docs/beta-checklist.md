# dw-kit v1.0 — Open Beta Test Checklist

> **Version**: 1.0.0
> **Date**: 2026-03-24
> **Focus**: npm package distribution, CLI commands, cross-platform

---

## Pre-requisites

- [ ] Node.js >= 18 installed
- [ ] npm available
- [ ] Git available
- [ ] (Optional) Claude Code CLI installed for full testing

---

## 1. Installation

### 1.1 Global Install
```bash
npm install -g dw-kit
```
- [ ] Installs without errors
- [ ] `dw --version` returns `1.0.0`
- [ ] `dw --help` lists all 4 commands (init, upgrade, validate, doctor)

### 1.2 npx (Zero-install)
```bash
npx dw-kit --version
```
- [ ] Downloads and runs correctly
- [ ] Returns correct version

### 1.3 Local Dev (npm link)
```bash
git clone <repo> && cd dw-kit
npm install && npm link
```
- [ ] `npm install` installs 4 dependencies cleanly
- [ ] `npm link` registers global `dw` command
- [ ] `dw --version` works after link

---

## 2. `dw init` — Setup Wizard

### 2.1 Interactive Mode
```bash
mkdir test-project && cd test-project && git init
dw init
```
- [ ] Banner displays correctly (ASCII art)
- [ ] [1/3] Project name question appears, default = directory name
- [ ] [2/3] Depth selection: quick/standard/thorough
- [ ] [3/3] Language: vi/en
- [ ] Roles are auto-selected from depth (quick=dev, standard=dev+techlead, thorough=full team)
- [ ] Platform auto-detected
- [ ] Files created correctly (see Section 2.5)
- [ ] Summary prints all chosen values

### 2.2 Preset Mode
```bash
dw init --preset solo-quick
dw init --preset small-team
dw init --preset enterprise
```
- [ ] `solo-quick`: depth=quick, roles=[dev], estimation=false
- [ ] `small-team`: depth=standard, roles=[dev,techlead], estimation=true
- [ ] `enterprise`: depth=thorough, roles=[dev,techlead,ba,qc,pm], log_work=true
- [ ] Invalid preset prints error with available options

### 2.3 Silent Mode (CI)
```bash
DW_NAME="ci-project" DW_DEPTH="standard" DW_ROLES="dev,techlead" DW_LANG="en" \
dw init --silent
```
- [ ] No interactive prompts
- [ ] Config matches env vars
- [ ] Project name from DW_NAME
- [ ] If `DW_DEPTH=thorough` and `DW_ROLES` is too narrow (e.g. `dev`), required roles are auto-added with warning

### 2.4 Adapter Selection
```bash
dw init --preset solo-quick --adapter claude-cli
dw init --preset solo-quick --adapter cursor
dw init --preset solo-quick --adapter generic
```
- [ ] `claude-cli`: creates `.claude/` + `CLAUDE.md`
- [ ] `cursor`: creates `.cursor/rules/dw-workflow.mdc` + `AGENT.md`
- [ ] `generic`: creates `AGENT.md` only, no `.claude/`

### 2.5 Generated Files Checklist
After `dw init --preset small-team`:
- [ ] `.dw/config/dw.config.yml` — valid YAML, correct values
- [ ] `config/config.schema.json` — JSON Schema present
- [ ] `config/presets/solo-quick.yml` — preset file
- [ ] `config/presets/small-team.yml` — preset file
- [ ] `config/presets/enterprise.yml` — preset file
- [ ] `core/WORKFLOW.md` — 6-phase methodology
- [ ] `core/THINKING.md` — thinking framework
- [ ] `core/QUALITY.md` — quality strategy
- [ ] `core/ROLES.md` — role definitions
- [ ] `.dw/core/templates/vi/` — Vietnamese templates
- [ ] `.dw/adapters/claude-cli/overrides/` — override directory
- [ ] `.dw/adapters/claude-cli/extensions/` — extensions directory
- [ ] `adapters/generic/AGENT.md` — generic adapter
- [ ] `.claude/skills/` — 22 skill directories
- [ ] `.claude/agents/` — 5 agent files
- [ ] `.claude/hooks/` — 4 hook scripts
- [ ] `.claude/rules/` — 3 rule files
- [ ] `.claude/settings.json` — permissions + hooks
- [ ] `CLAUDE.md` — with Tech Stack section appended
- [ ] `.dw/tasks/` — runtime directory
- [ ] `.dw/docs/` — runtime directory
- [ ] `.gitignore` — has dw-kit entries

### 2.6 Reinitialize Guard
```bash
dw init --preset solo-quick   # first time
dw init --preset enterprise   # second time
```
- [ ] Warning: "already initialized" on second run
- [ ] Asks for confirmation before overwriting

---

## 3. `dw validate` — Config Validation

### 3.1 Valid Config
```bash
dw validate
```
- [ ] "YAML syntax valid"
- [ ] "Schema validation passed"
- [ ] Semantic checks run (may show warnings for defaults)

### 3.2 Invalid Config
Edit `.dw/config/dw.config.yml` and add `unknown_key: true`:
```bash
dw validate
```
- [ ] Reports "Unknown key: unknown_key"
- [ ] Exit code 1

### 3.3 Invalid Enum
Change `default_depth: "invalid"`:
```bash
dw validate
```
- [ ] Reports invalid enum value
- [ ] Shows allowed values: quick, standard, thorough

### 3.4 Semantic Warnings
Set `quality.block_on_fail: true` with empty test_command:
```bash
dw validate
```
- [ ] Warning: "block_on_fail is true but no test_command"

---

## 4. `dw doctor` — Health Check

### 4.1 Healthy Project
```bash
dw doctor
```
- [ ] Environment: Node version, platform, working dir, CLI version
- [ ] Core Files: 4/4 green
- [ ] Config: 2/2 green, shows version numbers
- [ ] Claude Files: settings.json + hooks checked
- [ ] Adapter Structure: 3 directories checked
- [ ] Runtime Directories: .dw/tasks, .dw/docs
- [ ] Diagnosis: "Everything looks good!"

### 4.2 Empty Project
```bash
mkdir empty && cd empty && dw doctor
```
- [ ] Reports MISSING for core files
- [ ] Reports MISSING for config
- [ ] Exit code 1

### 4.3 Partial Project
Delete `core/THINKING.md` and run `dw doctor`:
- [ ] Reports that specific file as MISSING
- [ ] Other files still show green

---

## 5. `dw upgrade` — Smart Update

### 5.1 Check Mode
```bash
dw upgrade --check
```
- [ ] Shows installed vs project versions
- [ ] Reports "Already up to date" or "Update available"

### 5.2 Dry Run
```bash
dw upgrade --dry-run
```
- [ ] Lists all layers checked
- [ ] Shows new/modified/unchanged counts
- [ ] "DRY RUN complete — no changes made"

### 5.3 Layer-specific Upgrade
```bash
dw upgrade --layer core --dry-run
dw upgrade --layer platform --dry-run
```
- [ ] Only checks specified layer

### 5.4 Override Respect
Create `.dw/adapters/claude-cli/overrides/skills/plan/SKILL.md` with custom content:
```bash
dw upgrade
```
- [ ] Warning: "plan: override exists → keeping your version"
- [ ] Custom SKILL.md preserved, not overwritten

### 5.5 Extension Preservation
Create `.dw/adapters/claude-cli/extensions/my-skill/SKILL.md`:
```bash
dw upgrade
```
- [ ] Extension copied to `.claude/skills/my-skill/`
- [ ] Extension not deleted

---

## 6. Cross-Platform Testing

### 7.1 Windows
- [ ] `npm install -g dw-kit` works
- [ ] `dw init --preset small-team` works
- [ ] File paths use correct separators
- [ ] `.claude/hooks/*.sh` files copied correctly

### 7.2 macOS
- [ ] `npm install -g dw-kit` works
- [ ] `dw init` interactive mode works
- [ ] All commands function correctly

### 7.3 Linux
- [ ] `npm install -g dw-kit` works
- [ ] Permissions on bin/dw.mjs correct (executable)
- [ ] All commands function correctly

---

## 8. Edge Cases

- [ ] Run `dw init` in non-git directory → still works (no git required)
- [ ] Run `dw init` in directory with existing `.claude/` → files updated, not duplicated
- [ ] Run `dw validate` with empty config file → reports parse error
- [ ] Run `dw upgrade` after deleting `core/` → adds missing files back
- [ ] Config with comments preserved after `dw upgrade` (YAML comments may be lost — document)
- [ ] Very long project name → no truncation issues
- [ ] Unicode in project name → handled correctly
- [ ] Run without Node.js 18+ → clear error message

---

## 9. Automated Smoke Tests

```bash
npm test
```
- [ ] All tests pass
- [ ] Temp files cleaned up after tests
- [ ] No leftover processes

---

## 10. npm Publish Readiness

- [ ] `npm pack --dry-run` shows 88 files, ~86 kB
- [ ] No dev files in package (docs/, examples/, .dw/, project-templates/)
- [ ] LICENSE file included
- [ ] README.md included (auto by npm)
- [ ] package.json has correct: name, version, description, bin, files, engines
- [ ] `npm whoami` shows logged-in user
- [ ] `npm publish --dry-run` succeeds (verify before actual publish)

---

## Known Limitations (Document for Beta Users)

1. `dw upgrade` rewrites `.dw/config/dw.config.yml` using js-yaml — YAML comments are not preserved
2. Cursor adapter generates a basic rules file — full skill conversion is planned for v1.1
3. MCP server config in `dw.config.yml` is not yet auto-generated into `.claude/settings.json` by the CLI (manual update may be required)
5. Interactive mode may not render correctly in some Windows terminals (use --preset or --silent as fallback)

---

## Publishing Steps

```bash
# 1. Final verify
npm test
npm pack --dry-run

# 2. Login to npm
npm login

# 3. Publish beta
npm publish --tag beta

# 4. Test install from npm
npm install -g dw-kit@beta
dw --version
dw doctor

# 5. Promote to latest (when ready)
npm dist-tag add dw-kit@1.0.0 latest
```
