# dv-workflow-kit

> Bộ workflow toolkit cho dev team sử dụng Claude Code Agent — từ requirements đến dashboard.

**v0.3** · [Docs](docs/README.md) · [Cheatsheet](docs/cheatsheet.md) · [Examples](examples/)

---

## Toolkit Này Làm Gì?

Thay vì để Claude tự do code, dv-workflow-kit tạo ra **rails có cấu trúc**:

```
Research trước  →  Plan  →  Execute (TDD)  →  Review  →  Commit
```

Với đầy đủ hỗ trợ cho các roles trong team: BA · TL · Dev · QC · PM.

---

## Quick Start (2 bước)

### Bước 1 — Setup (~1-2 phút)

```bash
git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow
bash .dv-workflow/setup.sh
```

Wizard sẽ hỏi 4 câu và tự cấu hình mọi thứ: project name, level, roles, language.

### Bước 2 — Bắt đầu

Mở Claude Code trong thư mục dự án, chạy:

```
/dw-task-init tên-feature
```

---

## Level System

| Level | Dành cho | Workflow |
|-------|----------|----------|
| **1** | Solo dev, hotfix nhanh | research → execute → commit |
| **2** | Team nhỏ, feature mới | research → plan → execute → review → commit |
| **3** | Enterprise, audit trail | full workflow + living docs + metrics + dashboard |

---

## Skills Có Sẵn (22 skills)

Xem [docs/cheatsheet.md](docs/cheatsheet.md) để có bảng tham chiếu nhanh.

---

## Cấu Trúc Sau Khi Setup

```
dự-án-của-bạn/
├── .dv-workflow/          ← toolkit (git submodule, read-only)
├── .claude/               ← skills, agents, rules, hooks
├── .dw/                   ← tasks, docs, metrics, reports
└── dv-workflow.config.yml ← config của bạn
```

---

## Demo

- [Demo A](examples/demo-A-bug-fix/) — Bug fix workflow (Level 1, ~30 phút đọc)
- [Demo B](examples/demo-B-new-feature/) — Full team feature workflow (Level 2, BA → PM)

---

## Tài Liệu

| Tài liệu | Nội dung |
|----------|---------|
| [docs/README.md](docs/README.md) | Hướng dẫn đầy đủ, setup, tips |
| [docs/cheatsheet.md](docs/cheatsheet.md) | Bảng tham chiếu nhanh tất cả skills |
| [examples/integration-guide/](examples/integration-guide/) | Hướng dẫn tích hợp chi tiết |

---

> **Note**: v0.3 là beta — đang dùng nội bộ. API có thể thay đổi trước v1.0.
> Maintainer: [huygdv](mailto:huygdv19@gmail.com)
