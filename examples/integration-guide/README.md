# Integration Guide — dv-workflow-kit

> **v0.1** · Repo: [github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)

Hướng dẫn tích hợp dv-workflow-kit vào dự án thực tế của bạn.

## Phương Thức Tích Hợp: Git Submodule

Toolkit được thêm vào dự án của bạn dưới dạng git submodule trong thư mục `.dv-workflow/`.
Sau khi setup, bạn copy files cần thiết vào project. Workflow:

```
Dự án của bạn/
├── .dv-workflow/          ← git submodule (dv-workflow-kit)
├── .claude/               ← được copy từ toolkit, bạn customize
│   ├── skills/
│   ├── agents/
│   ├── rules/
│   └── settings.json
├── templates/             ← task doc templates
├── skills/
│   └── THINKING.md
└── dv-workflow.config.yml ← config của bạn
```

---

## Bước 1: Thêm Submodule

Trong root của dự án của bạn:

```bash
git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow
git submodule update --init
```

> Thay `YOUR_ORG/dv-workflow-kit` bằng repo URL thực tế.

---

## Bước 2: Chạy Setup Script

```bash
# Mặc định: project type "new-product"
bash .dv-workflow/integration-guide/setup.sh

# Hoặc chỉ định project type
bash .dv-workflow/integration-guide/setup.sh old-maintenance
```

Script sẽ tự động:
- Copy `.claude/` (skills, agents, rules, hooks) — không overwrite files đã có
- Copy `skills/THINKING.md`
- Copy `templates/`
- Tạo `dv-workflow.config.yml` từ template phù hợp
- Tạo `CLAUDE.md` nếu chưa có
- Tạo runtime directories: `.dev-tasks/`, `.dev-docs/`, `.dev-metrics/`, `.dev-reports/`
- Thêm `.gitignore` entries

---

## Bước 3: Cấu Hình `dv-workflow.config.yml`

Mở file vừa được tạo và cập nhật:

```yaml
project:
  name: "Tên Dự Án Của Bạn"   # ← CẬP NHẬT
  type: new-product             # hoặc old-maintenance

team:
  roles:
    - dev                       # ← Bật roles phù hợp với team
    - techlead
    # - ba
    # - qc
    # - pm

level: 2                        # 1=light | 2=standard | 3=enterprise
```

### Chọn Level Phù Hợp

| Level | Dành cho | Workflow |
|-------|----------|----------|
| **1** | Solo dev, outsource nhanh, hotfix | research → execute → commit |
| **2** | Team nhỏ, startup, feature mới | research → plan → execute → review → commit |
| **3** | Team lớn, enterprise, audit trail | full workflow + living docs + metrics + dashboard |

---

## Bước 4: Tùy Chỉnh CLAUDE.md

`CLAUDE.md` được copy từ toolkit nhưng bạn nên bổ sung project-specific rules:

```markdown
# Thêm vào cuối CLAUDE.md

## Tech Stack
- Framework: NestJS + TypeScript
- Database: PostgreSQL (TypeORM)
- Testing: Jest

## Project-Specific Rules
- Mọi API endpoint phải có Swagger doc
- Database migrations phải có rollback script
```

---

## Bước 5: Kiểm Tra & Bắt Đầu

Khởi động Claude Code trong thư mục dự án của bạn:

```bash
claude
```

Chạy skill khởi tạo (nếu cần cấu hình lại config):
```
/config-init tên-dự-án
```

Bắt đầu task đầu tiên:
```
/task-init tên-feature
```

---

## Cập Nhật Toolkit

Khi dv-workflow-kit có version mới:

```bash
# Pull latest version
cd .dv-workflow && git pull origin main && cd ..

# Re-run setup để merge files mới (không overwrite customizations của bạn)
bash .dv-workflow/integration-guide/setup.sh
```

> Lưu ý: `cp -n` (no-clobber) đảm bảo files đã customize không bị overwrite.
> Xem changelog của toolkit để biết files nào mới cần merge thủ công.

---

## Cấu Trúc Sau Setup

```
dự-án-của-bạn/
├── .dv-workflow/                 # submodule (read-only)
│   └── ...toolkit source...
│
├── .claude/                      # customizable
│   ├── skills/
│   │   ├── research/SKILL.md
│   │   ├── plan/SKILL.md
│   │   ├── execute/SKILL.md
│   │   ├── commit/SKILL.md
│   │   ├── review/SKILL.md
│   │   └── ...
│   ├── agents/
│   │   ├── researcher.md
│   │   ├── planner.md
│   │   └── reviewer.md
│   ├── rules/
│   │   ├── code-style.md
│   │   └── commit-standards.md
│   └── settings.json             # hooks
│
├── .dev-tasks/                   # task docs (commit vào git)
│   └── [task-name]/
│       ├── [task-name]-context.md
│       ├── [task-name]-plan.md
│       └── [task-name]-progress.md
│
├── .dev-docs/                    # living docs (commit vào git)
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DATA-MODELS.md
│
├── .dev-metrics/                 # runtime metrics (gitignore)
├── .dev-reports/                 # generated reports (gitignore)
│
├── skills/
│   └── THINKING.md
├── templates/
│   ├── task-context.md
│   ├── task-plan.md
│   ├── task-progress.md
│   └── pr-template.md
│
├── dv-workflow.config.yml        # config của bạn
└── CLAUDE.md                     # instructions của bạn
```

---

## Câu Hỏi Thường Gặp

**Q: Tôi có thể sửa files trong `.claude/skills/` không?**
A: Có. Files này là của bạn sau khi copy. Toolkit không overwrite chúng khi update.

**Q: Nếu team không dùng một số skill thì sao?**
A: Dùng flags trong config. Ví dụ: `estimation: false` để tắt /estimate và /log-work.

**Q: Nhiều dev trong team, ai cũng copy toolkit?**
A: Submodule commit vào git nên mọi người đều có. Chạy `git submodule update --init` sau khi clone.

**Q: `.dev-tasks/` có commit vào git không?**
A: Có, đây là living docs. `.dev-metrics/` và `.dev-reports/` thì không (đã gitignore).
