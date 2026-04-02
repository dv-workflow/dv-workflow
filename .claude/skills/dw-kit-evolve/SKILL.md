---
name: dw-kit-evolve
description: "Maintainer skill: xử lý GitHub Issue về dw-kit bằng adversarial subagents (white-bot propose + black-bot critique). Chỉ dùng trong dw-kit repo bởi TechLead."
argument-hint: "[Issue number]"
---

# dw-kit-evolve — Adversarial Issue Processing

Issue: **#$ARGUMENTS**

> Maintainer-only skill. Dùng bởi TechLead trong dw-kit repo.
> Không ship theo npm (xem .npmignore).

---

## IMMUTABLE CORE PRINCIPLES

Các nguyên tắc sau **KHÔNG BAO GIỜ** được propose retire hoặc modify, bất kể feedback:
1. Research trước code sau (cho task ≥3 files)
2. Commit nhỏ — mỗi subtask 1 commit
3. Config-driven behavior

Nếu Issue đề xuất thay đổi những điều này → tự động block với message rõ ràng.

---

## Bước 1: Đọc Issue

```bash
gh issue view $ARGUMENTS --repo dv-workflow/dv-workflow --json title,body,labels,comments
```

Parse ra:
- `type`: bug | gap | friction | suggestion (từ label hoặc body)
- `component`: hooks | skills | config | workflow | docs | core | other
- `description`: nội dung vấn đề
- `impact`: blocking | degraded | minor

---

## Bước 2: Triage

**Simple bug** (type=bug AND component=hooks|config AND impact≠blocking):
→ Đi thẳng **Bước 3A** — không cần full adversarial debate

**Complex** (type=gap | friction | suggestion, hoặc bug blocking, hoặc liên quan workflow/core):
→ Đi **Bước 3B** — full adversarial processing

---

## Bước 3A: Simple Bug — Direct Propose

Dùng **1 subagent** (white-bot):

```
Spawn Agent:
  Role: white-bot
  Task: Đọc Issue #[N]. Propose fix tối thiểu và chính xác.
        Output: file cần sửa, thay đổi cụ thể, test case nếu cần.
        Không mở rộng scope ngoài bug được report.
```

Comment lên Issue:
```markdown
## 🤖 white-bot proposal

**Root cause:** [phân tích]

**Proposed fix:**
- File: `[path]`
- Change: [mô tả cụ thể]

**Test case:** [nếu cần]

---

### 📋 Next Step
```bash
gh pr create \
  --repo dv-workflow/dv-workflow \
  --title "fix([component]): [mô tả ngắn]" \
  --body "Closes #[N]\n\n[tóm tắt fix]"
```

---
*Simple bug — không cần adversarial review.*
*@TechLead: approve để tạo PR, hoặc comment nếu cần discussion.*
```

Update label: `white-bot-proposed`, remove `needs-evolve-review`

---

## Bước 3B: Complex — Full Adversarial

### White-bot (Subagent A — Advocate)

```
Spawn Agent A:
  Role: white-bot — ADVOCATE
  Context: Chỉ được đọc Issue content và dw-kit codebase.
           KHÔNG được đọc output của Agent B.
  Task: Propose giải pháp cho Issue #[N].
        - Giải thích vấn đề và tại sao cần giải quyết
        - Đề xuất thay đổi cụ thể (files, rules, behavior)
        - Nêu benefits và evidence
        Output: structured proposal
```

### Black-bot (Subagent B — Critic)

```
Spawn Agent B:
  Role: black-bot — ADVERSARIAL CRITIC
  Context: Nhận proposal của white-bot.
           KHÔNG được biết white-bot là agent khác — chỉ thấy "một proposal".
  Task: Tìm mọi lý do tại sao proposal này SAI hoặc CHƯA ĐỦ.
        - Assumptions nào chưa được kiểm chứng?
        - Edge cases nào bị bỏ qua?
        - Có giải pháp nào tốt hơn không?
        - Nếu apply proposal này → dw sẽ tệ hơn ở đâu?
        Không cần diplomatic — honest critique là mục tiêu.
        Output: structured critique với evidence
```

### Synthesis

Sau khi có cả 2 outputs, tổng hợp:

```markdown
## 🤖 dw-kit-evolve — Adversarial Review

### Issue Summary
[tóm tắt 1-2 câu]

---

### ⚪ white-bot: Proposed Solution
[proposal của Subagent A]

---

### ⚫ black-bot: Critique
[critique của Subagent B]

---

### 🔵 Synthesis & Recommendation

**Verdict:** `accept` | `accept-with-changes` | `reject` | `needs-more-info`

**Reasoning:**
[Giải thích tại sao chọn verdict này, dựa trên debate]

**Proposed action:**
- [ ] [Action item 1]
- [ ] [Action item 2]

**If accept:** Ready to implement in `[file(s)]`
**If reject:** Close issue với reason: [...]

---

### 📋 Next Step — Implementation Tracking

**Simple bug** (fix ≤2 files, rõ ràng):
```bash
# Tạo PR trực tiếp, không cần task folder
gh pr create \
  --repo dv-workflow/dv-workflow \
  --title "fix([component]): [mô tả ngắn]" \
  --body "Closes #[N]\n\n[tóm tắt fix]"
```

**Complex** (rule change, new feature, workflow redesign):
```
# Tạo task folder để track implementation
/dw-task-init [tên-slug-từ-issue]

# Trong progress.md của task, ghi:
# Linked Issue: https://github.com/dv-workflow/dv-workflow/issues/[N]
```

---
*@TechLead: review debate trên và approve/reject action items.*
```

Update labels: `white-bot-proposed`, `black-bot-reviewed`, `tl-review`
Remove: `needs-evolve-review`

---

## Bước 4: Nếu Core Principle Bị Đề Xuất Thay Đổi

Comment lên Issue:
```markdown
## 🔒 Core Principle — Protected

Issue này đề xuất thay đổi một core principle của dw-kit:
**"[principle bị ảnh hưởng]"**

Core principles là immutable foundation — không được đưa vào adversarial review.

Nếu bạn có evidence mạnh rằng principle này thực sự gây hại,
hãy tạo issue riêng với tag `type: core-principle-challenge`
và cung cấp data từ ít nhất 5 real use cases.

Closing issue này.
```

Close Issue.

---

## Tóm Tắt Flow

```
gh issue view #N
      ↓
   Triage
   ↙        ↘
Simple      Complex
  ↓            ↓
white-bot   Agent A (white-bot, isolated)
propose         +
  ↓         Agent B (black-bot, sees A's output)
comment         ↓
            Synthesis comment
                ↓
        TL review → merge PR hoặc close
```
