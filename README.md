# dw-kit

> Bộ workflow toolkit cho dev team sử dụng Claude Code Agent — từ requirements đến dashboard.

**v2.0** · [Docs](docs/README.md) · [Cheatsheet](docs/cheatsheet.md) · [Migration v0.3→v2](scripts/migrate-v03-to-v2.sh)

---

## Toolkit Này Làm Gì?

Thay vì để Claude tự do code, dw-kit tạo ra **rails có cấu trúc**:

```
Research  →  Plan  →  Execute (TDD)  →  Review  →  Commit
```

Với đầy đủ hỗ trợ cho các roles trong team: BA · TL · Dev · QC · PM.

---

## Quick Start (2 bước)

### Bước 1 — Setup (~1-2 phút)

```bash
git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow
bash .dw-module/setup.sh
```

Wizard sẽ hỏi và tự cấu hình: project name, depth, roles, language.

### Bước 2 — Bắt đầu

Mở Claude Code trong thư mục dự án, chạy:

```
/dw-task-init tên-feature
```

---

## Depth System (thay thế Level 1/2/3)

| Depth | Dành cho | Workflow |
|-------|----------|----------|
| `quick` | Solo dev, hotfix, familiar code | Understand → Execute → Close |
| `standard` | Team nhỏ, feature mới | Tất cả 6 phases |
| `thorough` | Enterprise, API/DB/security changes | Full workflow + arch-review + test-plan |

Cấu hình trong `config/dw.config.yml`:
```yaml
workflow:
  default_depth: "standard"
```

---

## Kiến Trúc v2 (4 Layers)

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
    └── migrate-v03-to-v2.sh      ← migration từ v0.3
```

---

## Skills Có Sẵn

Xem [docs/cheatsheet.md](docs/cheatsheet.md) để có bảng tham chiếu nhanh.

---

## Migrating từ v0.3

```bash
bash scripts/migrate-v03-to-v2.sh --dry-run   # preview
bash scripts/migrate-v03-to-v2.sh             # apply
```

Script sẽ:
- Map `level: 2` → `default_depth: standard`
- Preserve customized skills vào `adapters/claude-cli/overrides/`
- Tạo symlink backward-compat cho `config/dw.config.yml`

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
| [docs/strategy-v2-claude-optimized.md](docs/strategy-v2-claude-optimized.md) | Chiến lược tận dụng Claude capabilities |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi |

---

> Maintainer: [huygdv](mailto:huygdv19@gmail.com)
