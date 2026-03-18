# dv-workflow-kit

Bộ toolkit workflow cho dev team sử dụng Claude Code Agent.
Đọc `dv-workflow.config.yml` để biết cấu hình hiện tại của dự án.

## Quy Tắc Vàng

1. **Config-driven**: Mọi behavior đọc từ `dv-workflow.config.yml`. Kiểm tra flags trước khi enforce.
2. **Research trước, code sau**: Task >= 3 files BẮT BUỘC qua research → plan → execute.
3. **Tư duy có hệ thống**: Áp dụng framework trong `.claude/skills/thinking/THINKING.md` khi planning.
4. **Test trước implement**: Viết test trước khi code (TDD khi applicable).
5. **Commit nhỏ, commit thường xuyên**: Mỗi subtask = 1 commit.
6. **Living docs**: Docs phải cập nhật khi code thay đổi (nếu flag bật).

## Routing Theo Độ Phức Tạp

Đọc `routing` trong config để xác định ngưỡng. Mặc định:
- **1-2 files**: Execute trực tiếp hoặc `/dw-debug`. Vẫn nên `/dw-research` nhanh.
- **3-5 files**: BẮT BUỘC `/dw-task-init` → `/dw-research` → `/dw-plan` → approve → `/dw-execute`
- **6+ files**: Chia sub-tasks, mỗi phần có workflow riêng.

Nếu không chắc scope → dùng workflow đầy đủ.

## Level System

Đọc `level` trong config:
- **Level 1**: research → execute → commit (nhanh, cho task nhỏ/maintenance)
- **Level 2**: research → plan → execute → review → commit (chuẩn)
- **Level 3**: full workflow + living docs + metrics + dashboard (enterprise)

## Skills Có Sẵn

### Core Workflow
| Skill | Mô tả | Flag |
|-------|--------|------|
| `/dw-config-init` | Khởi tạo config cho dự án mới | always |
| `/dw-task-init [name]` | Tạo bộ docs cho task | always |
| `/dw-research [name]` | Khảo sát codebase | `research` |
| `/dw-plan [name]` | Lập kế hoạch implementation | `plan` |
| `/dw-execute [name]` | Thực hiện theo plan (TDD) | `execute` |
| `/dw-commit [msg]` | Smart commit + quality gates | `commit` |

### Quality & Debug
| Skill | Mô tả | Flag |
|-------|--------|------|
| `/dw-review` | Code review theo checklist | `review` |
| `/dw-debug [issue]` | Debug: investigate → diagnose → fix | `debug` |
| `/dw-docs-update` | Cập nhật living docs | `living_docs` |

### Tracking & Metrics
| Skill | Mô tả | Flag |
|-------|--------|------|
| `/dw-estimate [name]` | Ước lượng effort cho task | `estimation` |
| `/dw-log-work [name]` | Ghi nhận effort thực tế | `log_work` |
| `/dw-dashboard` | Generate báo cáo cho PM | `dashboard_skill` |

### Role-Specific
| Skill | Role | Flag |
|-------|------|------|
| `/dw-requirements` | BA | `requirements_skill` |
| `/dw-test-plan` | QC | `test_plan_skill` |
| `/dw-arch-review` | TL | `arch_review_skill` |

### Collaboration
| Skill | Mô tả | Flag |
|-------|--------|------|
| `/dw-handoff` | Bàn giao session | `handoff` |

## Cấu Trúc Task Documentation

Mỗi task tạo bộ docs tại `{paths.tasks}/[task-name]/`:
```
[task-name]-context.md   # Research findings
[task-name]-plan.md      # Implementation plan
[task-name]-progress.md  # Progress tracking + effort log
```

## Khi Bắt Đầu Session Mới

1. Đọc `dv-workflow.config.yml` để biết level, flags, team config
2. Kiểm tra `{paths.tasks}/` cho active tasks
3. Đọc file progress của task đang dở (nếu có)
4. Tiếp tục từ subtask cuối cùng

## Commit Message Format

```
<type>(<scope>): <mô tả ngắn>

[chi tiết nếu cần]

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, refactor, test, docs, chore, style, perf
