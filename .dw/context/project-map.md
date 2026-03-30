# Project Map: dw-kit

## Ngày tạo: 2026-03-28
## Tạo bởi: dw-onboard

---

## Tech Stack

- **Ngôn ngữ**: JavaScript (ESM, `.mjs`)
- **Runtime**: Node.js (≥18)
- **Package manager**: npm
- **Config format**: YAML (`js-yaml`)
- **CLI framework**: commander.js + inquirer (interactive prompts)
- **Database**: không có
- **Infrastructure**: npm publish, GitHub releases

## Cấu Trúc Tổng Quan

```
dw-kit/
├── src/
│   ├── cli.mjs              ← CLI entry point (bin)
│   ├── commands/            ← 6 CLI commands
│   │   ├── init.mjs         ← dw init
│   │   ├── upgrade.mjs      ← dw upgrade
│   │   ├── validate.mjs     ← dw validate
│   │   ├── doctor.mjs       ← dw doctor
│   │   ├── prompt.mjs       ← dw prompt
│   │   └── claude-vn-fix.mjs← dw claude-vn-fix
│   └── lib/                 ← Shared utilities
│       ├── config.mjs       ← YAML config read/write
│       ├── copy.mjs         ← File copy utilities
│       ├── ui.mjs           ← CLI output helpers
│       ├── platform.mjs     ← OS detection
│       ├── clipboard.mjs    ← Clipboard integration
│       ├── prompt-suggest.mjs ← Autocomplete logic
│       └── update-checker.mjs ← npm version check
│
├── .claude/
│   ├── skills/              ← 26 AI skills (SKILL.md per skill)
│   ├── templates/           ← Task doc templates (vi + en)
│   ├── rules/               ← AI behavior rules (3 files)
│   └── agents/              ← Agent definitions
│
├── .dw/
│   ├── config/              ← dw.config.yml (project config)
│   ├── core/                ← Methodology docs (WORKFLOW, THINKING, QUALITY, ROLES)
│   ├── adapters/            ← Platform-specific overrides (claude-cli, generic)
│   └── context/             ← [này] Project map & module docs (dw-onboard output)
│
├── project-templates/       ← Starter templates (new-product, enterprise, old-maintenance)
├── schemas/                 ← JSON Schema (effort-log)
├── docs/                    ← User-facing guides
├── bin/                     ← npm bin entry
└── scripts/                 ← Build/release scripts
```

## Modules

| Module | Type | Vai trò | Files | Phức tạp | Active? | Deep-dive? |
|--------|------|---------|-------|---------|---------|------------|
| `src/commands` | feature | CLI commands — giao diện user | 6 files | **Cao** | Có | `/dw-retroactive commands` |
| `src/lib` | util | Shared utilities cho commands | 7 files | **Cao** | Có | `/dw-retroactive lib` |
| `.claude/skills` | feature | 26 AI skills — core product | 26 dirs | **Cao** | Có | `/dw-retroactive skills` |
| `.dw/core` | docs | Methodology: WORKFLOW, THINKING, QUALITY, ROLES | 5 files | TB | Ít | — |
| `.claude/templates` | infra | Task doc templates (vi/en) | 8 files | Thấp | Ít | — |
| `.claude/rules` | infra | AI behavior rules | 3 files | Thấp | Ít | — |
| `project-templates` | infra | Starter templates cho user projects | 3 dirs | TB | Ít | — |
| `docs` | docs | Getting-started guides, cheatsheet | 8 files | Thấp | Ít | — |
| `schemas` | infra | JSON Schema validation | 1 file | Thấp | Không | — |

## Dependencies giữa Modules

```
src/cli.mjs
    ├── src/commands/init.mjs
    │       ├── src/lib/config.mjs      (read/write YAML)
    │       ├── src/lib/copy.mjs        (copy template files)
    │       ├── src/lib/ui.mjs          (prompts + output)
    │       └── src/lib/platform.mjs    (detect OS)
    ├── src/commands/upgrade.mjs
    │       ├── src/lib/config.mjs
    │       ├── src/lib/copy.mjs
    │       └── src/lib/ui.mjs
    ├── src/commands/prompt.mjs
    │       ├── src/lib/prompt-suggest.mjs
    │       ├── src/lib/clipboard.mjs
    │       └── src/lib/ui.mjs
    ├── src/commands/doctor.mjs         → src/lib/config.mjs, ui.mjs
    ├── src/commands/validate.mjs       → src/lib/config.mjs, ui.mjs
    └── src/commands/claude-vn-fix.mjs  → src/lib/platform.mjs, ui.mjs

.claude/skills/* (SKILL.md)
    → Đọc .dw/config/dw.config.yml tại runtime (không phải import)
    → Tham chiếu .claude/templates/ cho task doc output
    → Tham chiếu .dw/core/ cho methodology
    → Output vào .dw/tasks/ hoặc .dw/context/
```

## Entry Points chính

- `bin/dw` → `src/cli.mjs`: CLI entry, đăng ký tất cả commands
- `src/commands/init.mjs:initCommand()`: setup wizard cho project mới
- `.claude/skills/dw-flow/SKILL.md`: AI orchestrator chạy full workflow end-to-end

## Conventions phát hiện

- **ESM only**: tất cả source dùng `.mjs` + `import/export`, không có CommonJS
- **Thin commands, fat lib**: commands chỉ orchestrate, logic nằm trong `lib/`
- **Guard-clause pattern**: early return khi check config/file tồn tại
- **Config-driven skills**: mọi SKILL.md đều bắt đầu bằng đọc `dw.config.yml`
- **Skill isolation**: mỗi skill là 1 dir với 1 `SKILL.md` — không share state
- **Language-aware**: templates có `vi/` và `en/` variants, điều hướng qua config
- **Presets**: `init` có 3 preset profiles (`solo-quick`, `small-team`, `enterprise`)

## Git Activity (3 tháng gần nhất)

- **Active modules**: `src/commands`, `.claude/skills`, `docs`, `CLAUDE.md`
- **Stable modules**: `src/lib`, `.dw/core`, `schemas`, `.claude/templates`
- **Top contributor**: 1 contributor (solo project)
- **Velocity**: ~20 commits, active feature development

## Gợi ý Deep-dive

Modules phức tạp nên chạy `/dw-retroactive` để AI có full context:

- [ ] `/dw-retroactive commands` — 6 CLI commands, 1,135 lines, business logic của toàn bộ CLI
- [ ] `/dw-retroactive lib` — 7 shared utilities, cross-cutting concerns
- [ ] `/dw-retroactive skills` — 26 AI skills, core product value
