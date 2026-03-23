# Progress: dw-kit v2 Upgrade

## Trạng thái: In Progress
## Branch: dev
## Bắt đầu: 2026-03-23
## Kết thúc: —

---

## Subtask Progress

| # | Subtask | Trạng thái | Commit | Ghi chú |
|---|---------|-----------|--------|---------|
| ST-A1 | core/WORKFLOW.md | Pending | | |
| ST-A2 | core/THINKING + QUALITY + ROLES | Pending | | |
| ST-A3 | CLAUDE.md redesign | Pending | | |
| ST-B1 | adapters/claude-cli/ structure | Pending | | |
| ST-B2 | scripts/upgrade.sh | Pending | | |
| ST-B3 | scripts/migrate-v03-to-v2.sh | Pending | | |
| ST-C1 | Enhanced agents + executor | Pending | | |
| ST-C2 | New hooks + settings.json | Pending | | |
| ST-D1 | config/dw.config.yml + presets | Pending | | |
| ST-D2 | config/config.schema.json | Pending | | |
| ST-D3 | setup.sh update | Pending | | |
| ST-E1 | core/templates/vi/ questionnaires | Pending | | |
| ST-E2 | adapters/generic/AGENT.md | Pending | | |
| ST-E3 | docs + README + CHANGELOG | Pending | | |

## Changelog

### 2026-03-23 — Khởi tạo task
- Research xong: toolkit-evaluation-report-20260318.md
- Plan v2 draft: docs/plan-v2-flexible-first.md
- Strategy supplement: docs/strategy-v2-claude-optimized.md
- Task docs created, plan approved bởi huygdv

## Phát Hiện Mới

| # | Phát hiện | Ảnh hưởng | Hành động | Trạng thái |
|---|-----------|-----------|-----------|-----------|
| 1 | setup.sh cần python3 cho YAML parsing | ST-D3 | Dùng python3 yaml thay vì grep/awk | Open |

## Blockers

(none)

## Handoff Notes

### Session 2026-03-23 (session 1)
- **Đang ở**: Bắt đầu Phase A — ST-A1 (WORKFLOW.md)
- **Context quan trọng**: Plan đã được review kỹ, approved. Strategy supplement tại `docs/strategy-v2-claude-optimized.md` là source of truth cho implementation.
- **Thứ tự execute**: A → B → C → D → E (foundational trước)
- **Bước tiếp theo**: ST-A1: tạo `core/WORKFLOW.md` với 6 phases và section anchors
- **Cẩn thận**: WORKFLOW.md KHÔNG được đặt vào always-loaded context (CLAUDE.md). Mỗi subtask = 1 commit.
