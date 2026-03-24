# Integration Guide — dv-workflow-kit

> **v0.3** · Repo: [github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)

Hướng dẫn tích hợp dv-workflow-kit vào dự án thực tế của bạn.

## Phương Thức Tích Hợp: Git Submodule

Toolkit được thêm vào dự án của bạn dưới dạng git submodule trong thư mục `.dw-module/`.
Sau khi setup, bạn copy files cần thiết vào project. Workflow:

```
Dự án của bạn/
├── .dw-module/          ← git submodule (dv-workflow-kit, read-only)
├── .claude/               ← được copy từ toolkit, bạn customize
│   ├── skills/            ← 22 skills (bao gồm thinking/THINKING.md)
│   ├── agents/
│   ├── rules/
│   ├── hooks/
│   ├── templates/         ← task doc templates (vi/ và en/)
│   └── settings.json
├── .dw/tasks/            ← task docs (runtime)
├── .dw/docs/             ← living docs (runtime)
└── config/dw.config.yml ← config của bạn
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

## Bước 2: Chạy Setup Wizard

```bash
bash .dw-module/setup.sh
```

Wizard hỏi 4 câu (~1-2 phút) và tự cấu hình tất cả. Silent mode cho CI:

```bash
DW_NAME="my-app" DW_LEVEL=2 DW_ROLES="dev,techlead" DW_LANG="vi" \
bash .dw-module/setup.sh --silent
```

Script sẽ tự động:
- Copy `.claude/` (skills, agents, rules, hooks, **templates**) — không overwrite files đã có
- Tạo `config/dw.config.yml` từ template phù hợp
- Tạo `CLAUDE.md` nếu chưa có
- Tạo runtime directories: `.dw/tasks/`, `.dw/docs/`, `.dw/metrics/`, `.dw/reports/`
- Thêm `.gitignore` entries

---

## Bước 3: Cấu Hình `config/dw.config.yml`

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
bash .dw-module/integration-guide/setup.sh
```

> Lưu ý: `cp -n` (no-clobber) đảm bảo files đã customize không bị overwrite.
> Xem changelog của toolkit để biết files nào mới cần merge thủ công.

---

## Cấu Trúc Sau Setup

```
dự-án-của-bạn/
├── .dw-module/                 # submodule (read-only)
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
├── .dw/tasks/                   # task docs (commit vào git)
│   └── [task-name]/
│       ├── [task-name]-context.md
│       ├── [task-name]-plan.md
│       └── [task-name]-progress.md
│
├── .dw/docs/                    # living docs (commit vào git)
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DATA-MODELS.md
│
├── .dw/metrics/                 # runtime metrics (gitignore)
├── .dw/reports/                 # generated reports (gitignore)
│
├── config/dw.config.yml        # config của bạn
└── CLAUDE.md                     # instructions của bạn

# NOTE (v0.2+): templates/ và skills/ KHÔNG còn ở project root.
# Tất cả nằm trong .claude/ — xem .claude/templates/ và .claude/skills/thinking/
```

---

## Câu Hỏi Thường Gặp

**Q: Tôi có thể sửa files trong `.claude/skills/` không?**
A: Có. Files này là của bạn sau khi copy. Toolkit không overwrite chúng khi update.

**Q: Nếu team không dùng một số skill thì sao?**
A: Dùng flags trong config. Ví dụ: `estimation: false` để tắt /estimate và /log-work.

**Q: Nhiều dev trong team, ai cũng copy toolkit?**
A: Submodule commit vào git nên mọi người đều có. Chạy `git submodule update --init` sau khi clone.

**Q: `.dw/tasks/` có commit vào git không?**
A: Có, đây là living docs. `.dw/metrics/` và `.dw/reports/` thì không (đã gitignore).
