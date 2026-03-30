# Context: retroactive-skills

## Ngày khảo sát: 2026-03-28
## Người thực hiện: agent

---

## Yêu Cầu Gốc

> dw-kit phục vụ tốt cho task/feature mới nhưng thiếu skill retroactive cho các task/feature cũ trong dự án mà human dev đã implemented trước khi sử dụng dw. Cần hai skill:
> 1. `/dw-onboard` — one-time adoption khi đưa dw vào project đang chạy (breadth-first)
> 2. `/dw-retroactive [name]` — deep-dive document 1 feature/task cụ thể đã tồn tại (depth-first)

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Cần thay đổi? | Ghi chú |
|---|------|---------|----------------|---------|
| 1 | `.claude/skills/dw-research/SKILL.md` | Reference pattern cho skill mới | Không | Dùng làm template |
| 2 | `.claude/skills/dw-task-init/SKILL.md` | Reference cho output structure | Không | |
| 3 | `.claude/skills/dw-plan/SKILL.md` | Reference cho plan format | Không | |
| 4 | `CLAUDE.md` | Skill registry | Có | Thêm 2 entries mới |
| 5 | `.claude/rules/workflow-rules.md` | Level requirements | Có | Thêm level cho 2 skills mới |
| 6 | `.claude/skills/dw-onboard/SKILL.md` | Skill mới | Tạo mới | |
| 7 | `.claude/skills/dw-retroactive/SKILL.md` | Skill mới | Tạo mới | |

### Kiến Trúc Hiện Tại

```
dw-kit workflow (forward-looking):
User → /dw-task-init → /dw-research → /dw-plan → /dw-execute → /dw-commit
                                                                      ↓
                                                              .dw/tasks/[name]/

GAP: Existing codebase không có entry point
Existing code → ??? → AI mù quáng mỗi session
```

### Data Flow — Gap Phân Tích

- **Input hiện tại**: Task mới từ user
- **Gap**: Code đã tồn tại không có structured context trong `.dw/tasks/`
- **Output cần thêm**:
  - `.dw/context/` — project-wide map (dw-onboard)
  - `.dw/tasks/[name]/` với as-built docs (dw-retroactive)

## Dependencies

### Upstream
- [ ] `.dw/config/dw.config.yml` — config cho paths.tasks, language
- [ ] `.claude/templates/task-context.md` — template cho context docs
- [ ] `.claude/skills/dw-thinking/THINKING.md` — framework tư duy

### Downstream
- [ ] `dw-research` — hưởng lợi khi context đã có sẵn từ dw-retroactive
- [ ] `dw-plan` — quality tốt hơn với module context đã documented
- [ ] `dw-flow` — không cần thay đổi, dw-onboard là standalone

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ |
|---------|--------|-------|
| SKILL.md frontmatter | name, description, argument-hint, allowed-tools | dw-research/SKILL.md:1-17 |
| Config-first | Luôn đọc dw.config.yml trước | Tất cả skills |
| Output to paths.tasks | Task docs vào `.dw/tasks/[name]/` | dw-task-init |
| Suggest next skill | Cuối mỗi skill gợi ý skill tiếp | dw-research:94-98 |

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | dw-onboard output vào `.dw/context/` (tách khỏi `.dw/tasks/`) | Không | Vẫn hợp lý — onboard là project-wide, không phải task-level |
| 2 | dw-retroactive tạo full task docs như task bình thường | Không | Consistent với existing pattern |
| 3 | Skill không cần thêm vào dw-flow pipeline | Có | Onboard là pre-adoption, không phải trong-task |

## Ghi Chú Bổ Sung

- `dw-onboard` là **breadth-first**: scan rộng, output shallow per module
- `dw-retroactive` là **depth-first**: narrow scope, output đầy đủ như task thực
- Hai skill không overlap: onboard = adoption event, retroactive = on-demand per feature
- Plan doc của retroactive dùng label "As-Built" thay vì "Draft/Approved" để phân biệt
