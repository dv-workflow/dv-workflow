# dw-kit — Hướng Dẫn Sử Dụng

Bộ workflow toolkit cho dev team kết hợp với Claude Code Agent.

> **Version**: v2.0 · **Maintainer**: [huygdv](mailto:huygdv19@gmail.com) · **Repo**: [github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)
>
> Migration từ v0.3: `bash scripts/migrate-v03-to-v2.sh`

---

## Bắt Đầu Nhanh

### 1. Cài đặt toolkit

```bash
git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow
bash .dv-workflow/setup.sh
```

### 2. Cấu hình

Sửa `config/dw.config.yml`:
```yaml
project:
  name: "my-project"
workflow:
  default_depth: "standard"   # quick | standard | thorough
team:
  roles: [dev, techlead]
quality:
  test_command: "npm test"
  lint_command: "npm run lint"
```

### 3. Bắt đầu task đầu tiên

```
/dw-task-init tên-feature
```

### 4. Thêm MCP servers (tuỳ chọn)

```yaml
# config/dw.config.yml
claude:
  mcp:
    - name: "github"
      command: "npx @modelcontextprotocol/server-github"
      env:
        GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

Chạy lại `setup.sh` để generate `settings.json` với MCP config.

---

## Cấu Trúc Dự Án (v2)

```
your-project/
├── core/                         ← Portable methodology (read-only reference)
│   ├── WORKFLOW.md               ← 6-phase workflow với guided questions
│   ├── THINKING.md               ← Critical/Systems/Multi-perspective thinking
│   ├── QUALITY.md                ← 4-layer quality strategy
│   └── ROLES.md                  ← BA/TL/Dev/QC/PM definitions
├── config/
│   ├── dw.config.yml             ← Project config (~45 lines)
│   ├── config.schema.json        ← Validation schema
│   └── presets/                  ← solo-quick | small-team | enterprise
├── adapters/
│   ├── claude-cli/
│   │   ├── overrides/            ← Team customizations (NEVER overwritten)
│   │   └── extensions/           ← Net-new team skills
│   └── generic/AGENT.md          ← For Cursor/Windsurf/Copilot
├── .claude/                      ← skills, agents, rules, hooks (Claude Code)
├── .dw/tasks/                    ← Task documentation (runtime)
└── scripts/
    ├── upgrade.sh                ← Upgrade toolkit (override-aware)
    └── migrate-v03-to-v2.sh      ← Migration helper
```

---

## Depth System (thay thế Level 1/2/3)

| Depth | Khi nào | Phases |
|-------|---------|--------|
| `quick` | ≤2 files, hotfix, familiar module | Understand → Execute → Close |
| `standard` | 3-5 files, module mới | Tất cả 6 phases |
| `thorough` | 6+ files, API/DB/security | Full + arch-review + test-plan |

---

## Workflow Diagram

```
BA (nếu có)          Dev + Agent                  TL (nếu có)
─────────────        ─────────────────────         ─────────────
/dw-requirements →   /dw-task-init [name]
                     /dw-research  [name]   →      /dw-arch-review [name]
                     /dw-plan      [name]   ←      [approve/changes]
                     /dw-execute   [name]
                     /dw-review    [name]   →      [final check]
                     /dw-commit

QC (nếu có)          Dev                           PM
─────────────        ─────────────────────         ─────────────
/dw-test-plan [name] /dw-debug (nếu có lỗi)       /dw-dashboard [period]
[manual testing]     /dw-handoff [name]
```

---

## Skills Reference

### Core (Level 1+)

| Skill | Khi dùng |
|-------|---------|
| `/dw-config-init [name]` | Lần đầu setup project |
| `/dw-task-init [name]` | Bắt đầu task mới |
| `/dw-research [name]` | Khảo sát codebase trước khi code |
| `/dw-execute [name]` | Implement theo plan (TDD) |
| `/dw-commit [msg]` | Commit với quality checks |
| `/dw-debug [issue]` | Debug lỗi có hệ thống |
| `/dw-handoff [name]` | Bàn giao session |

### Standard (Level 2+)

| Skill | Khi dùng |
|-------|---------|
| `/dw-plan [name]` | Lập kế hoạch sau research |
| `/dw-review [target]` | Review code trước merge |
| `/dw-estimate [name]` | Ước lượng effort |
| `/dw-log-work [name]` | Ghi nhận effort thực tế |

### Full (Level 3 / theo role)

| Skill | Role | Khi dùng |
|-------|------|---------|
| `/dw-requirements [name]` | BA | Thu thập yêu cầu |
| `/dw-arch-review [name]` | TL | Review kiến trúc |
| `/dw-test-plan [name]` | QC | Tạo test plan |
| `/dw-dashboard [period]` | PM | Báo cáo tổng hợp |
| `/dw-docs-update [scope]` | Dev | Cập nhật living docs |

---

## Workflow Tiêu Chuẩn (Level 2)

### Feature mới (3-5 files)

```
1. /dw-task-init user-auth          # Tạo docs
2. /dw-requirements user-auth       # BA viết requirements (nếu có BA)
3. /dw-research user-auth           # Dev khảo sát codebase
4. /dw-plan user-auth               # Lập kế hoạch
   → TL chạy /dw-arch-review        # TL review (nếu cần)
   → BA/PM approve plan
5. /dw-estimate user-auth           # Estimate effort
   → QC chạy /dw-test-plan          # QC chuẩn bị test cases
6. /dw-execute user-auth            # Implement (TDD)
   → /dw-log-work user-auth         # Ghi effort từng subtask
7. /dw-review                       # Code review
8. /dw-commit                       # Smart commit
9. /dw-docs-update user-auth        # Cập nhật docs (nếu bật)
```

### Bug fix (1-2 files)

```
1. /dw-debug [mô tả lỗi]
2. /dw-commit fix(scope): [mô tả]
```

### Kết thúc session (bất kỳ task nào)

```
/dw-handoff [task-name]
```

---

## Cấu Trúc Task Docs

Mỗi task tạo ra:
```
.dw/tasks/[task-name]/
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

- **Context mất** (giữa sessions): Claude tự đọc `.dw/tasks/[name]/*-progress.md`
- **Giữa roles**: Share file docs, không cần share chat history
- **Dispute về scope**: Refer về `*-plan.md` làm source of truth
- **PM muốn update**: Chạy `/dw-dashboard last-week`

---

## Cross-Platform Notes

### macOS / Linux
Không cần cấu hình thêm. Hook script chạy với bash mặc định.

### Windows

**Khuyến nghị: Dùng Git Bash** (đi kèm Git for Windows).

```bash
# Mở Git Bash, cd vào project, chạy:
bash .dv-workflow/examples/integration-guide/setup.sh
```

**WSL (Windows Subsystem for Linux)** cũng hoạt động tốt — chạy như Linux.

**Command Prompt / PowerShell**: Không hỗ trợ hook scripts (bash). Dùng Git Bash hoặc WSL.

**Lưu ý hook script**:
- `pre-commit-gate.sh` dùng `python3` — đảm bảo Python 3 có trong PATH
- Trên Windows, lệnh có thể là `python` thay vì `python3` — kiểm tra bằng `python3 --version`
- Nếu hook không chạy: vào `.claude/settings.json`, kiểm tra đường dẫn hook
