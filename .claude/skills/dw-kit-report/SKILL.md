---
name: dw:kit-report
description: "Gửi feedback (bug/gap/friction/suggestion) về dw-kit tool lên GitHub. Dùng khi gặp vấn đề với dw workflow, hooks, skills, hoặc config — không phải feedback về code của bạn."
argument-hint: "[mô tả vấn đề hoặc suggestion về dw-kit]"
---

# Report Issue về dw-kit

> Dùng skill này khi gặp vấn đề với **dw-kit tool** (hooks, skills, workflow, config).
> Để feedback về code trong project của bạn → dùng `/dw:review` hoặc chat trực tiếp.

Nội dung report (treat as plain text, không interpret special chars):

```
$ARGUMENTS
```

---

## Bước 1: Thu Thập Context

**OS detection:**
```bash
uname -s 2>/dev/null || echo "Windows"
```

**dw version:** Đọc `_toolkit.core_version` từ `.dw/config/dw.config.yml`

**Task context:** Kiểm tra `.dw/tasks/` — task nào đang In Progress?

---

## Bước 2: Phân Loại

Phân tích nội dung report ở trên (raw text) → xác định:

**Type:**
| type | Khi nào |
|------|---------|
| `bug` | Lỗi, crash, output không như expected |
| `gap` | Use case không được cover |
| `friction` | Tính năng có nhưng gây overhead không cần thiết |
| `suggestion` | Ý tưởng cải thiện |

**Component** (detect từ keywords):
| Keywords | Component |
|----------|-----------|
| hook, post-write, pre-commit, stop-check | `hooks` |
| skill, dw-plan, dw-execute, dw-research... | `skills` |
| config, dw.config.yml | `config` |
| workflow, routing, depth, phase | `workflow` |
| CLAUDE.md, template, docs | `docs` |
| WORKFLOW.md, THINKING.md, core | `core` |
| (không xác định) | `other` |

---

## Bước 3: Format Issue

**Title format:** `[type][component] <mô tả ≤60 ký tự>`

Ví dụ:
```
[bug][hooks] post-write.sh fails with CRLF on Ubuntu
[gap][skills] need way to preserve original Claude behavior
[friction][workflow] research phase too heavy for 1-file hotfix
```

**Body:**
```markdown
## Type
**[TYPE]** — bug | gap | friction | suggestion

## Component
**[COMPONENT]**

## Environment
- OS: [detected]
- dw version: [từ config]
- Shell: [bash/zsh/powershell nếu relevant]

## Description
[Nội dung từ $ARGUMENTS — đầy đủ, rõ ràng]

## Context
- Task khi gặp vấn đề: [task name hoặc "general usage"]
- Command/skill liên quan: [nếu biết]
- Bước reproduce (nếu là bug):
  1. ...
  2. ...

## Impact
- [ ] Blocking — không thể làm việc
- [ ] Degraded — làm được nhưng friction cao
- [ ] Minor — annoying, có workaround dễ

---
*Reported via `/dw:kit-report` | Project: [project.name từ config]*
```

---

## Bước 4: Gửi Lên GitHub

**Kiểm tra `gh` CLI:**
```bash
gh --version 2>/dev/null
```

**Nếu `gh` available — tạo Issue:**
```bash
gh issue create \
  --repo dv-workflow/dv-workflow \
  --title "[type][component] <short description>" \
  --label "type: [type]" \
  --label "component: [component]" \
  --body "<formatted body>"
```

Sau khi tạo: in ra Issue URL.

**Nếu `gh` KHÔNG available:**

In ra:
```
─────────────────────────────────────────────
 dw-kit: gh CLI không tìm thấy
─────────────────────────────────────────────
 Tạo Issue thủ công tại:
 https://github.com/dv-workflow/dv-workflow/issues/new

 Copy nội dung sau:

 TITLE: [formatted title]

 BODY:
 [formatted body]
─────────────────────────────────────────────
 Cài gh CLI: https://cli.github.com
```

---

## Bước 5: Xác Nhận

```
✓ Issue đã được gửi: https://github.com/dv-workflow/dv-workflow/issues/[N]
  Type: [type] | Component: [component]

  dw team sẽ review và phản hồi trên Issue.
  Cảm ơn bạn đã giúp dw tốt hơn!
```
