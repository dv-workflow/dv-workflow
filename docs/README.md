# dv-workflow-kit — Hướng Dẫn Sử Dụng

Bộ toolkit workflow cho dev team kết hợp với Claude Code Agent.

> **Version**: v0.1 (beta) · **Maintainer**: [huygdv](mailto:huygdv19@gmail.com) · **Repo**: [github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)

---

## Bắt Đầu Nhanh

### 1. Copy vào dự án mới

```bash
# Trong thư mục dự án của bạn
cp -r path/to/dv-workflow-kit/.claude .
cp -r path/to/dv-workflow-kit/templates .
cp -r path/to/dv-workflow-kit/skills .
cp path/to/dv-workflow-kit/CLAUDE.md .
```

### 2. Chọn config template

```bash
# Dự án mới (new product)
cp path/to/dv-workflow-kit/project-templates/new-product/dv-workflow.config.yml .

# Dự án cũ/Maintenance
cp path/to/dv-workflow-kit/project-templates/old-maintenance/dv-workflow.config.yml .
```

### 3. Cập nhật config

Sửa `dv-workflow.config.yml`:
- `project.name` — tên dự án
- `team.roles` — roles thực tế trong team
- Bật/tắt flags theo nhu cầu

### 4. Khởi tạo

```
/config-init [project-name]
```

---

## Workflow Diagram

```
BA (nếu có)          Dev + Agent                  TL (nếu có)
─────────────        ─────────────────────         ─────────────
/requirements   →    /task-init [name]
                     /research  [name]   →         /arch-review [name]
                     /plan      [name]   ←         [approve/changes]
                     /execute   [name]
                     /review    [name]   →         [final check]
                     /commit

QC (nếu có)          Dev                           PM
─────────────        ─────────────────────         ─────────────
/test-plan [name]    /debug (nếu có lỗi)           /dashboard [period]
[manual testing]     /handoff [name]
```

---

## Skills Reference

### Core (Level 1+)

| Skill | Khi dùng |
|-------|---------|
| `/config-init [name]` | Lần đầu setup project |
| `/task-init [name]` | Bắt đầu task mới |
| `/research [name]` | Khảo sát codebase trước khi code |
| `/execute [name]` | Implement theo plan (TDD) |
| `/commit [msg]` | Commit với quality checks |
| `/debug [issue]` | Debug lỗi có hệ thống |
| `/handoff [name]` | Bàn giao session |

### Standard (Level 2+)

| Skill | Khi dùng |
|-------|---------|
| `/plan [name]` | Lập kế hoạch sau research |
| `/review [target]` | Review code trước merge |
| `/estimate [name]` | Ước lượng effort |
| `/log-work [name]` | Ghi nhận effort thực tế |

### Full (Level 3 / theo role)

| Skill | Role | Khi dùng |
|-------|------|---------|
| `/requirements [name]` | BA | Thu thập yêu cầu |
| `/arch-review [name]` | TL | Review kiến trúc |
| `/test-plan [name]` | QC | Tạo test plan |
| `/dashboard [period]` | PM | Báo cáo tổng hợp |
| `/docs-update [scope]` | Dev | Cập nhật living docs |

---

## Workflow Tiêu Chuẩn (Level 2)

### Feature mới (3-5 files)

```
1. /task-init user-auth          # Tạo docs
2. /requirements user-auth       # BA viết requirements (nếu có BA)
3. /research user-auth           # Dev khảo sát codebase
4. /plan user-auth               # Lập kế hoạch
   → TL chạy /arch-review        # TL review (nếu cần)
   → BA/PM approve plan
5. /estimate user-auth           # Estimate effort
   → QC chạy /test-plan          # QC chuẩn bị test cases
6. /execute user-auth            # Implement (TDD)
   → /log-work user-auth         # Ghi effort từng subtask
7. /review                       # Code review
8. /commit                       # Smart commit
9. /docs-update user-auth        # Cập nhật docs (nếu bật)
```

### Bug fix (1-2 files)

```
1. /debug [mô tả lỗi]
2. /commit fix(scope): [mô tả]
```

### Kết thúc session (bất kỳ task nào)

```
/handoff [task-name]
```

---

## Cấu Trúc Task Docs

Mỗi task tạo ra:
```
.dev-tasks/[task-name]/
├── [task]-context.md     # Research findings
├── [task]-plan.md        # Implementation plan
├── [task]-progress.md    # Progress + effort log + handoff notes
└── [task]-requirements.md  # (nếu có BA)
└── [task]-test-plan.md     # (nếu có QC)
```

---

## Level & Flags

Sửa trong `dv-workflow.config.yml`:

```yaml
level: 2  # 1 (lite) | 2 (standard) | 3 (full)

flags:
  plan: true          # true | false | "skip"
  review: true
  estimation: false   # Bật khi cần track effort
  living_docs: false  # Bật khi stable
  dashboard_skill: false  # Bật khi có PM
```

---

## Tips

- **Context mất** (giữa sessions): Claude tự đọc `.dev-tasks/[name]/*-progress.md`
- **Giữa roles**: Share file docs, không cần share chat history
- **Dispute về scope**: Refer về `*-plan.md` làm source of truth
- **PM muốn update**: Chạy `/dashboard last-week`
