# dv-workflow-kit — Cheatsheet

> Bảng tham chiếu nhanh. In ra hoặc ghim lên màn hình.

---

## Skills Theo Workflow Order

### 1. Bắt Đầu Task

| Skill | Khi nào | Level |
|-------|---------|-------|
| `/dw-config-init [name]` | Lần đầu setup project | any |
| `/dw-task-init [name]` | Mỗi task/feature mới | any |
| `/dw-requirements [name]` | BA viết requirements trước | any |

### 2. Research & Plan

| Skill | Khi nào | Level |
|-------|---------|-------|
| `/dw-research [name]` | Khảo sát codebase, tìm dependencies | any |
| `/dw-plan [name]` | Lập kế hoạch sau research — DỪNG chờ approve | 2+ |
| `/dw-arch-review [name]` | TL review kiến trúc + approve plan | 2+ |
| `/dw-estimate [name]` | Ước lượng effort (sau plan) | 2+ |

### 3. Execute

| Skill | Khi nào | Level |
|-------|---------|-------|
| `/dw-execute [name]` | Implement theo plan (TDD) | any |
| `/dw-test-plan [name]` | QC tạo test cases (song song với execute) | any |
| `/dw-log-work [name]` | Ghi effort sau mỗi subtask | 2+ |

### 4. Review & Close

| Skill | Khi nào | Level |
|-------|---------|-------|
| `/dw-review [target]` | Code review trước commit | 2+ |
| `/dw-commit [msg]` | Smart commit với quality checks | any |
| `/dw-docs-update [scope]` | Cập nhật living docs sau thay đổi | 3 |

### 5. Collaboration & Tracking

| Skill | Khi nào | Level |
|-------|---------|-------|
| `/dw-handoff [name]` | Cuối session, trước khi bàn giao | any |
| `/dw-debug [issue]` | Debug: investigate → diagnose → fix | any |
| `/dw-dashboard [period]` | PM xem báo cáo tổng hợp | 3 |

---

## Routing Nhanh

```
Task 1-2 files  →  /dw-debug  hoặc  /dw-execute trực tiếp
Task 3-5 files  →  /dw-task-init → /dw-research → /dw-plan → approve → /dw-execute
Task 6+ files   →  Chia sub-tasks, mỗi phần chạy riêng
```

---

## Không Chắc Scope? → Dùng Workflow Đầy Đủ

```
/dw-task-init [name]
/dw-research  [name]
/dw-plan      [name]    ← DỪNG, chờ approve
/dw-execute   [name]
/dw-review
/dw-commit
```

---

## Flag States (trong config)

| Giá trị | Ý nghĩa |
|---------|---------|
| `true` | Skill hoạt động, bắt buộc trong workflow |
| `false` | Skill bị tắt, bỏ qua |
| `"skip"` | Skill có sẵn nhưng optional, user tự quyết |

---

## Lỗi Thường Gặp

| Triệu chứng | Fix |
|-------------|-----|
| Skill không chạy | Kiểm tra flag trong `config/dw.config.yml` |
| Agent không có tools | Đọc agent constraint trong `.claude/agents/` |
| Execute bị block | Kiểm tra plan đã được approve chưa |
| Context mất | Đọc `.dw/tasks/[name]/*-progress.md` |

---

*Xem đầy đủ: [docs/README.md](README.md)*
