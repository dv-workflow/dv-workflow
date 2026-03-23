# Context: dw-kit v2 Upgrade

## Ngày khảo sát: 2026-03-23
## Người thực hiện: Claude Agent

---

## Yêu Cầu Gốc

Restructure toàn bộ dw-kit từ v0.3 (22 skills, Claude-coupled) sang v2 (4-layer architecture):
- Portable methodology core (platform-agnostic)
- Claude-optimized execution layer tận dụng tối đa Claude Code capabilities
- Upgrade-safe customization system (overrides, không bị overwrite)
- Simplified config (~40 lines thay vì 130)

Tài liệu gốc: `docs/plan-v2-flexible-first.md` + `docs/strategy-v2-claude-optimized.md`

## Codebase Analysis

### Files Liên Quan

| # | File/Dir | Vai trò | Cần thay đổi? | Ghi chú |
|---|----------|---------|----------------|---------|
| 1 | `.claude/skills/` (22 files) | Skill definitions | Migrate → `core/WORKFLOW.md` + skill shells | Consolidate methodology, giữ execution |
| 2 | `.claude/agents/` (4 files) | Agent definitions | Enhance in-place | researcher, planner, reviewer, quality-checker |
| 3 | `.claude/hooks/pre-commit-gate.sh` | Quality gate | Keep + thêm 2 hooks mới | safety-guard.sh, post-write.sh |
| 4 | `.claude/settings.json` | Permissions + hooks | Expand 2→4 hooks, thêm MCP slot | |
| 5 | `.claude/skills/thinking/THINKING.md` | Thinking framework | Move → `core/THINKING.md` | |
| 6 | `dv-workflow.config.yml` | Central config | Migrate → `config/dw.config.yml` | Rename + add claude: section |
| 7 | `CLAUDE.md` | Always-loaded context | Redesign → tiered loading (~150 lines) | |
| 8 | `setup.sh` | Installation wizard | Extend: generate settings.json từ config | |

### Kiến Trúc Hiện Tại (v0.3)

```
dv-workflow.config.yml (central config)
        │
        ├── CLAUDE.md (routing, always loaded)
        ├── .claude/rules/ (3 rule files)
        ├── .claude/skills/ (22 SKILL.md, loaded on invocation)
        │       └── .claude/agents/ (4 agents)
        ├── .claude/hooks/pre-commit-gate.sh
        └── .dw/tasks/ (runtime output)
```

### Kiến Trúc Đề Xuất (v2)

```
config/dw.config.yml (~40 lines + claude: section)
        │
        ├── CLAUDE.md (tiered loader, ~150 lines)
        ├── core/                    ← MỚI: portable methodology
        │   ├── WORKFLOW.md          ← consolidate 22 skills thành 6 phases
        │   ├── THINKING.md          ← moved from .claude/skills/thinking/
        │   ├── QUALITY.md           ← 4-layer quality strategy (mới)
        │   └── ROLES.md             ← role definitions (mới)
        │
        ├── adapters/claude-cli/     ← MỚI: 4-layer execution
        │   ├── generated/           ← auto-generated skill shells + agents
        │   ├── overrides/           ← team customizations (never overwritten)
        │   └── extensions/          ← net-new team skills
        │
        ├── .claude/                 ← giữ nguyên structure (populated từ adapters/)
        │   ├── skills/              ← thin shells referencing core/WORKFLOW.md
        │   ├── agents/              ← enhanced (+ executor agent mới)
        │   ├── hooks/               ← 4 hooks (thêm safety-guard, post-write, notification)
        │   └── settings.json        ← generated từ config (includes MCP slot)
        │
        └── scripts/
            ├── upgrade.sh           ← override-aware upgrade
            └── migrate-v03-to-v2.sh ← migration helper
```

## Dependencies

### Upstream
- Claude Code CLI (hooks, agent delegation, MCP)
- Existing 22 skill files (content cần preserve khi consolidate)

### Downstream (bị ảnh hưởng)
- CLAUDE.md — redesign hoàn toàn
- settings.json — generated từ config thay vì hand-maintained
- Tất cả dự án đang dùng v0.3 (cần migration script)

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ |
|---------|--------|-------|
| Config-driven | Mọi behavior đọc từ YAML config | `dv-workflow.config.yml` |
| Least-privilege agents | Mỗi agent chỉ có tools cần thiết | `disallowedTools: [Write, Edit]` |
| On-demand skill loading | Skill load instructions khi invoke, không always-loaded | `.claude/skills/*/SKILL.md` |
| File-based context passing | Research → context.md → Plan → plan.md → Execute | `.dw/tasks/[name]/` |

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | WORKFLOW.md 3000+ lines sẽ không cần always-loaded | Không — on-demand là đúng design | N/A |
| 2 | overrides/ mechanism đủ để preserve user customizations | Có — test với custom skill sample | Cần fallback: backup strategy |
| 3 | generate settings.json từ dw.config.yml là reliable | Có — test edge cases (empty MCP list) | Manual settings.json là fallback |
| 4 | Claude skill instructions có thể trigger deep reasoning | Có — test plan quality trước/sau | Deep reasoning là bonus, không required |

## Hạn Chế Đã Biết

- `extended_thinking` API parameter không control được từ SKILL.md — chỉ có thể encourage qua instructions
- Generic adapter (AGENT.md) sẽ không replicate agent delegation behavior — honest về limitation
- Migration script không thể tự detect 100% customizations — cần user review

## Chưa Rõ / Cần Làm Rõ

- [x] WORKFLOW.md section anchors format → dùng HTML comment `<!-- @phase:X -->`
- [x] Override resolution order → overrides/ thắng generated/, extensions/ không conflict
- [ ] Cursor adapter scope → Phase E, định nghĩa rõ limitations trước khi implement
