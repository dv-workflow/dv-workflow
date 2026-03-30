# Module: .claude/skills

## Vai trò
26 AI skills — core product value của dw-kit. Mỗi skill là 1 directory chứa `SKILL.md`: prompt template hướng dẫn AI thực hiện một phase cụ thể trong workflow. Không phải code — là instructions cho AI agent.

## Danh sách Skills

### Adoption (2 skills — mới thêm)
| Skill | Vai trò |
|-------|---------|
| `dw-onboard` | One-time breadth-first scan khi adopt dw vào existing project |
| `dw-retroactive` | Depth-first retroactive doc cho 1 feature đã tồn tại |

### Core Workflow (6 skills)
| Skill | Vai trò |
|-------|---------|
| `dw-task-init` | Khởi tạo task docs (context, plan, progress) |
| `dw-research` | Khảo sát codebase trước khi plan |
| `dw-plan` | Lập kế hoạch — DỪNG chờ human approve |
| `dw-execute` | Implement theo plan đã approve (TDD) |
| `dw-commit` | Smart commit + quality gates |
| `dw-flow` | Orchestrator: chạy full workflow end-to-end |

### Quality & Review (4 skills)
| Skill | Vai trò |
|-------|---------|
| `dw-review` | Code review: Critical/Warning/Suggestion |
| `dw-test-plan` | QC: tạo test plan + regression checklist |
| `dw-debug` | Debug: Investigate → Diagnose → Fix |
| `dw-thinking` | Critical thinking framework |

### Planning & Estimation (3 skills)
| Skill | Vai trò |
|-------|---------|
| `dw-estimate` | Ước lượng effort từ plan |
| `dw-log-work` | Ghi effort thực tế |
| `dw-prompt` | Build structured prompt từ mô tả mơ hồ |

### Role-based (4 skills)
| Skill | Vai trò |
|-------|---------|
| `dw-requirements` | BA: thu thập + viết requirements |
| `dw-arch-review` | TL: architecture review trước execute |
| `dw-dashboard` | PM: metrics report |
| `dw-sprint-review` | Team retrospective |

### Ops & Maintenance (7 skills)
| Skill | Vai trò |
|-------|---------|
| `dw-handoff` | Tài liệu bàn giao session |
| `dw-docs-update` | Cập nhật living docs sau code change |
| `dw-rollback` | Revert task docs về trạng thái trước |
| `dw-archive` | Archive completed task docs |
| `dw-config-init` | Init config mới |
| `dw-config-validate` | Validate config |
| `dw-upgrade` | Upgrade toolkit version |

## Skill File Structure

```
.claude/skills/dw-[name]/
└── SKILL.md          ← frontmatter + instructions

Frontmatter fields:
  name: dw-[name]
  description: [1 câu — dùng trong skill registry]
  argument-hint: [hiển thị tab-complete hint]
  allowed-tools: [danh sách tools AI được phép dùng]
```

## Dependencies

- **Upstream**: `CLAUDE.md` — skill registry, routing rules
- **Upstream**: `.claude/rules/workflow-rules.md` — level requirements, flag behavior
- **Runtime reads**:
  - `.dw/config/dw.config.yml` — mọi skill đọc config đầu tiên
  - `.claude/templates/` — task doc output templates
  - `.dw/core/WORKFLOW.md`, `THINKING.md` — methodology reference
  - `.dw/tasks/[name]/` — task docs (read + write)
  - `.dw/context/` — project map (read)

## Conventions riêng

- **Config-first**: mọi skill bắt đầu bằng đọc config và check flags
- **Suggest next**: mọi skill kết thúc bằng gợi ý skill tiếp theo
- **Report format**: skills dùng box format `╔══╗` cho báo cáo kết quả
- **DỪNG pattern**: `dw-plan` explicitly DỪNG để chờ human approve trước execute

## Lưu ý cho AI

- Skills không phải code — là prompt templates. Thay đổi SKILL.md = thay đổi AI behavior
- `allowed-tools` trong frontmatter giới hạn tools AI được phép dùng trong skill đó
- Skills phụ thuộc vào config flags — nếu flag = false thì skill bị disabled
- `dw-flow` là skill duy nhất có thể gọi các skills khác (orchestrator pattern)
- Test một skill = chạy nó trong Claude Code với `/dw-[name]` và kiểm tra output
