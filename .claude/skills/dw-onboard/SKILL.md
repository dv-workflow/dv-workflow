---
name: dw:onboard
description: "Onboard dw-kit vào project đang chạy. Scan codebase, tạo project map và context docs cho các modules hiện có. Chạy một lần khi adopt dw vào existing project."
argument-hint: ""
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - "Bash(git log *)"
  - "Bash(git shortlog *)"
  - "Bash(ls *)"
  - "Bash(wc *)"
---

# dw-onboard — Onboard Existing Project vào dw-kit

> Dùng khi adopt dw-kit vào project đã chạy. Chạy **một lần**. Output là project map và context docs cho các modules hiện có — làm nền tảng cho AI trong các sessions sau.

---

## Đọc Config

Đọc `.dw/config/dw.config.yml`:
- `paths.tasks` → base tasks path
- `project.language` → ngôn ngữ output
- `project.name` → tên project

## Bước 1: Khám phá cấu trúc project

Scan top-level structure của codebase:

```
Glob: src/**, app/**, lib/**, packages/**, services/**, modules/**
Bash: ls -la (top level)
```

Xác định:
- **Project type**: monorepo / single app / microservices / library
- **Tech stack**: ngôn ngữ, framework chính (từ package.json, go.mod, requirements.txt, Cargo.toml, v.v.)
- **Entry points**: main files, index files, routers
- **Major directories**: mỗi dir là 1 potential module

## Bước 2: Phân loại modules

Với mỗi major directory/module, xác định:

| Module | Type | Vai trò | Files | Phức tạp? |
|--------|------|---------|-------|-----------|
| [dir] | feature/service/util/infra | [mô tả 1 dòng] | [số files] | Cao/TB/Thấp |

**Phức tạp = Cao** nếu: nhiều files (>10), có DB/API, business logic phức tạp.
→ Modules phức tạp Cao: recommend `/dw:retroactive [module]` sau.

## Bước 3: Phân tích nhanh từng module

Với mỗi module (không cần đọc toàn bộ — chỉ đọc đủ để hiểu):

1. **Entry file**: đọc file chính (index, main, router, controller)
2. **Exports/Public API**: function/class/endpoint nào được expose?
3. **Dependencies**: module này gọi đến module nào khác?
4. **Git activity**: `git shortlog --since="6 months ago" -- [path]` → ai đang maintain?

Ghi tóm tắt ngắn gọn (3-5 dòng) per module.

## Bước 4: Check git history toàn project

```bash
git log --oneline --since="3 months ago" | head -30
git shortlog -sn --since="3 months ago" | head -10
```

Xác định:
- Modules nào đang active development
- Modules nào stable / ít thay đổi
- Contributors chính

## Bước 5: Tạo output

### 5a. Project Map

Tạo `.dw/context/project-map.md`:

```markdown
# Project Map: [project.name]

## Ngày tạo: [date]
## Tạo bởi: dw-onboard

---

## Tech Stack

- **Ngôn ngữ**: [language]
- **Framework**: [framework]
- **Database**: [db nếu có]
- **Infrastructure**: [docker, k8s, cloud nếu có]

## Cấu Trúc Tổng Quan

```
[ASCII tree của top-level structure]
```

## Modules

| Module | Type | Vai trò | Phức tạp | Active? | Deep-dive? |
|--------|------|---------|----------|---------|------------|
| [name] | [type] | [mô tả ngắn] | Cao/TB/Thấp | Có/Không | `/dw:retroactive [name]` |

## Dependencies giữa Modules

```
[Module A] → [Module B] → [Module C]
     ↓
[Module D]
```

## Entry Points chính

- [file/endpoint]: [mô tả]

## Conventions phát hiện

- [Convention 1]: [mô tả]
- [Convention 2]

## Git Activity (3 tháng gần nhất)

- **Active modules**: [danh sách]
- **Stable modules**: [danh sách]
- **Top contributors**: [tên]

## Gợi ý Deep-dive

Các modules phức tạp nên chạy `/dw:retroactive` để AI có context đầy đủ:
- [ ] `/dw:retroactive [module-a]` — [lý do: nhiều files, core business logic]
- [ ] `/dw:retroactive [module-b]`
```

### 5b. Module context docs

Với mỗi module **phức tạp Cao**: tạo `.dw/context/modules/[module-name].md`:

```markdown
# Module: [module-name]

## Vai trò
[1-2 câu mô tả]

## Files chính
| File | Vai trò |
|------|---------|
| [file] | [vai trò] |

## Public API / Exports
- [function/endpoint]: [mô tả]

## Dependencies
- Upstream: [modules gọi đến đây]
- Downstream: [modules được đây gọi]

## Conventions riêng
- [Convention đặc thù của module này]

## Lưu ý cho AI
- [Gotchas, tech debt, context quan trọng]
```

Với modules **phức tạp TB/Thấp**: chỉ ghi entry trong project-map.md, không tạo file riêng.

## Bước 6: Báo cáo kết quả

```
╔══════════════════════════════════════════════════════╗
║  ✅ dw-onboard complete: [project.name]
╠══════════════════════════════════════════════════════╣
║  Modules discovered   : [N]
║  Docs tạo             :
║    .dw/context/project-map.md
║    .dw/context/modules/[X files]
║  Tech stack           : [summary]
╠══════════════════════════════════════════════════════╣
║  Gợi ý tiếp theo:
║  Modules phức tạp cần deep-dive:
║  → /dw:retroactive [module-a]
║  → /dw:retroactive [module-b]
║
║  Khi bắt đầu task mới liên quan module đã có:
║  → AI sẽ tự đọc .dw/context/ để có context
╚══════════════════════════════════════════════════════╝
```

---

## Lưu ý

- **Không tạo `.dw/tasks/`** — onboard output vào `.dw/context/`, tách khỏi task docs
- **Không đọc toàn bộ code** — chỉ cần đủ để hiểu vai trò và interface của module
- **Không analyze chi tiết logic** — đó là việc của `/dw:retroactive` khi cần deep-dive
- Nếu project đã có `.dw/context/project-map.md` → hỏi user: "Đã có project map. Update hay skip?"
