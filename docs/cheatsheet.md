# dw-kit — Cheatsheet (v1.1)

> Bảng tham chiếu nhanh. In ra hoặc ghim lên màn hình.

---

## Skills Theo Workflow

### 0) Adopt dw vào Project Hiện Có

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-onboard` | Lần đầu adopt dw vào project đang chạy — scan toàn codebase | always |
| `/dw-retroactive [name]` | Document sâu một feature/module cụ thể đã có | always |

### 1) Start

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-config-init [name]` | Lần đầu setup project | all |
| `/dw-task-init [name]` | Mỗi task/feature mới | all |
| `/dw-requirements [name]` | BA viết requirements trước | standard+ |

### 2) Research & Plan

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-research [name]` | Khảo sát codebase, tìm dependencies | all |
| `/dw-plan [name]` | Lập kế hoạch sau research — dừng chờ approve | standard+ |
| `/dw-arch-review [name]` | TL review kiến trúc + approve plan | thorough |
| `/dw-estimate [name]` | Ước lượng effort (sau plan) | standard+ |

### 3) Execute

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-execute [name]` | Implement theo plan (TDD) | all |
| `/dw-test-plan [name]` | QC tạo test cases (song song với execute) | thorough |
| `/dw-log-work [name]` | Ghi effort sau mỗi subtask | standard+ |

### 4) Review & Close

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-review [target]` | Code review trước commit | standard+ |
| `/dw-commit [msg]` | Smart commit với quality checks | all |
| `/dw-docs-update [scope]` | Cập nhật living docs sau thay đổi | thorough |

### 5) Collaboration & Tracking

| Skill | Khi nào | Gợi ý depth |
|-------|---------|-------------|
| `/dw-handoff [name]` | Cuối session, trước khi bàn giao | all |
| `/dw-debug [issue]` | Debug: investigate → diagnose → fix | all |
| `/dw-dashboard [period]` | PM xem báo cáo tổng hợp | thorough |

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

## Depth Routing Nhanh

| Scope | Depth khuyến nghị |
|------|--------------------|
| 1-2 files, hotfix | `quick` |
| 3-5 files, feature thông thường | `standard` |
| 6+ files, API/DB/security | `thorough` |

---

## Lỗi Thường Gặp

| Triệu chứng | Fix |
|-------------|-----|
| Skill không chạy | Kiểm tra `team.roles` và `workflow.default_depth` trong `.dw/config/dw.config.yml` |
| Agent không có tools | Đọc agent constraint trong `.claude/agents/` |
| Execute bị block | Kiểm tra plan đã được approve chưa |
| Context mất | Đọc `.dw/tasks/[name]/*-progress.md` |

---

*Xem đầy đủ: [docs/README.md](README.md)*
