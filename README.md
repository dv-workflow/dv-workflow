# dw-kit

> Bộ workflow toolkit cho dev team sử dụng Claude Code Agent — từ requirements đến dashboard.

**v1.0** · `npm install -g dw-kit` · [Docs](docs/README.md) · [Cheatsheet](docs/cheatsheet.md) · [Migration v0.3→v1](scripts/migrate-v03-to-v1.sh)

---

## Toolkit Này Làm Gì?

Thay vì để Claude tự do code, dw-kit tạo ra **rails có cấu trúc**:

```
Research  →  Plan  →  Execute (TDD)  →  Review  →  Commit
```

Với đầy đủ hỗ trợ cho các roles trong team: BA · TL · Dev · QC · PM.

---

## Quick Start

### Option A — npm (recommended)

```bash
npm install -g dw-kit
```

Then in your project directory:

```bash
dw init
```

Interactive wizard asks 3 questions (project, depth, language) and auto-selects roles by depth. Or use presets:

```bash
dw init --preset small-team     # skip wizard
dw init --preset solo-quick     # solo dev, minimal ceremony
dw init --preset enterprise     # full team, all features
```

Zero-install (one-time use):

```bash
npx dw-kit init
```

### Option B — Git submodule (legacy)

```bash
git submodule add https://github.com/dv-workflow/dv-workflow.git .dw-module
bash .dw-module/setup.sh
```

`setup.sh` là luồng legacy/fallback. Luồng khuyến nghị cho v1 là `npm install -g dw-kit` + `dw init`.

### Start working

Open Claude Code in your project directory:

```
/dw-task-init tên-feature
```

### CLI Commands

```bash
dw init              # Setup wizard
dw upgrade           # Update toolkit files (override-aware)
dw upgrade --dry-run # Preview changes
dw upgrade --check   # Check for updates only
dw validate          # Validate config against schema
dw doctor            # Check installation health
dw migrate           # Migrate from v0.3 to v1
```

---

## Depth System (thay thế Level 1/2/3)

| Depth | Dành cho | Workflow |
|-------|----------|----------|
| `quick` | Solo dev, hotfix, familiar code | Understand → Execute → Close |
| `standard` | Team nhỏ, feature mới | Tất cả 6 phases |
| `thorough` | Enterprise, API/DB/security changes | Full workflow + arch-review + test-plan |

Cấu hình trong `.dw/config/dw.config.yml`:
```yaml
workflow:
  default_depth: "standard"
```

`default_depth` là baseline. Với task cụ thể, bạn có thể override sang `thorough` khi scope/risk tăng (API/DB/security), kể cả project nhỏ.

---

## Kiến Trúc v1 (4 Layers)

```
Layer 0: core/            ← Portable methodology (platform-agnostic)
Layer 1: .claude/         ← Claude Code execution (agents, hooks, skills)
Layer 2: config/claude:   ← Model-specific features (extended thinking, MCP)
Layer 3: adapters/overrides/ ← Team customizations (never overwritten by upgrade)
```

---

## Cấu Trúc Sau Khi Setup

```
dự-án-của-bạn/
├── .dw-module/                 ← toolkit (git submodule, read-only)
├── core/                         ← portable methodology
│   ├── WORKFLOW.md               ← 6-phase workflow
│   ├── THINKING.md               ← thinking framework
│   ├── QUALITY.md                ← 4-layer quality strategy
│   └── ROLES.md                  ← team role definitions
├── config/
│   ├── dw.config.yml             ← config (~45 lines)
│   ├── config.schema.json        ← validation schema
│   └── presets/                  ← solo-quick, small-team, enterprise
├── adapters/
│   ├── claude-cli/overrides/     ← team customizations (upgrade-safe)
│   ├── claude-cli/extensions/    ← net-new team skills
│   └── generic/AGENT.md          ← for Cursor/Windsurf/Copilot
├── .claude/                      ← skills, agents, rules, hooks
├── .dw/                          ← tasks, docs, metrics, reports
└── scripts/
    ├── upgrade.sh                ← upgrade toolkit (--dry-run)
    └── migrate-v03-to-v1.sh      ← migration từ v0.3
```

---

## Skills Có Sẵn

Xem [docs/cheatsheet.md](docs/cheatsheet.md) để có bảng tham chiếu nhanh.

---

## Migrating từ v0.3

```bash
dw migrate --dry-run   # preview changes
dw migrate             # apply migration
```

Or via bash (legacy):

```bash
bash scripts/migrate-v03-to-v1.sh --dry-run
bash scripts/migrate-v03-to-v1.sh
```

`scripts/upgrade.sh` và `scripts/migrate-v03-to-v1.sh` được giữ cho backward-compat; ưu tiên dùng `dw upgrade` và `dw migrate`.

Migration sẽ:
- Map `level: 2` → `default_depth: standard`
- Preserve customized skills vào `.dw/adapters/claude-cli/overrides/`
- Backup old config, create new `.dw/config/dw.config.yml`

---

## Demo

- [Demo A](examples/demo-A-bug-fix/) — Bug fix workflow (quick depth)
- [Demo B](examples/demo-B-new-feature/) — Full team feature workflow (BA → PM)

---

## Tài Liệu

| Tài liệu | Nội dung |
|----------|---------|
| [docs/README.md](docs/README.md) | Hướng dẫn đầy đủ, setup, tips |
| [docs/cheatsheet.md](docs/cheatsheet.md) | Bảng tham chiếu nhanh tất cả skills |
| [docs/custom-skills.md](docs/custom-skills.md) | Hướng dẫn tạo custom skills |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi |

---

> Maintainer: [huygdv](mailto:huygdv19@gmail.com)
