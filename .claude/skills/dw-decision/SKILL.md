---
name: dw:decision
description: "Tạo hoặc update Architecture Decision Record (ADR). Tự động đánh số, dùng template chuẩn. Wizard hướng dẫn qua: Context → Options → Decision → Consequences."
argument-hint: "[tên quyết định ngắn gọn]"
user-invocable: true
---

# ADR Wizard

Decision: **$ARGUMENTS**

## Bước 1 — Xác định số ADR

1. Đọc `.dw/decisions/` (tạo nếu chưa có)
2. Tìm file `NNNN-*.md` có số cao nhất
3. New ID: `ADR-{max+1}` zero-padded 4 digits

## Bước 2 — Thu thập input (hỏi user từng section)

### Context
- Tại sao decision này cần được đưa ra?
- Forces đang tác động? (deadline, constraint, incident, opportunity)
- Current state dẫn đến decision này là gì?

### Options Considered (BẮT BUỘC ≥2 phương án)

Cho MỖI option hỏi:
- **Option N: {Name}**
- **Pros:** (≥2 điểm cụ thể, không vague)
- **Cons:** (≥1 điểm thật, không "not chosen" placeholder)
- **Rejected because:** (nếu không chọn — lý do từ góc nhìn người quyết định)

### Decision
- Option nào được chọn?
- **Why this one** (not "because it's best" — cite concrete reason từ context)

### Consequences
- **Positive:** (≥2 outcomes expected)
- **Negative (trade-offs chấp nhận):** (≥1 — nếu nói "no cons" thì chưa nghĩ đủ)
- **Neutral:** (optional — side effects không tốt cũng không xấu)

### Metadata
- **Status:** default `Proposed`
- **Impact:** `patch` (small) | `minor` (feature-level) | `major` (breaking or strategic)
- **Deciders:** tên hoặc role
- **Cost estimate** (optional): rough effort

## Bước 3 — Tạo file

Path: `.dw/decisions/{NNNN}-{kebab-case-title}.md`

Copy structure từ `.dw/decisions/_template.md`. Điền:

```yaml
---
id: ADR-{NNNN}
title: {title}
status: Proposed
date: {YYYY-MM-DD}
deciders: {name}
impact: {patch|minor|major}
supersedes: null
superseded-by: null
---
```

Nếu là major impact → thêm section **Assumptions & Invalidation Triggers** và **Commitment Signals** (time-box).

## Bước 4 — Confirm & save

Show preview (first 30 lines) rồi ask:
```
Save this ADR to .dw/decisions/{NNNN}-{title}.md? (Y/n)
```

Nếu yes → write file + print:
```
✓ ADR-{NNNN} created
  Status: Proposed
  Next: Review → change status to Accepted when approved
        Related task: update tracking.md với reference
```

## Quality Bar

Reject auto-save nếu detect:
- Options considered < 2
- No "Rejected because" lý do cho options loại
- Consequences Negative trống (nghĩa là không nghĩ kỹ)
- Decision không cite cụ thể evidence từ context

Trong các case này, đẩy lại user với câu hỏi clarify.

## Khi NÀO Dùng ADR

✅ Architectural choice (framework, DB, pattern)
✅ Cross-cutting concern (auth, caching, logging)
✅ Breaking change affecting users
✅ Trade-off với long-term implications
✅ Decision reverses earlier ADR (mark old as Superseded)

❌ Bug fix (commit message đủ)
❌ Implementation detail (code comments đủ)
❌ Personal style preference

## Examples

- `.dw/decisions/0001-v2-pragmatic-lean.md` — strategic direction (major)
- `.dw/decisions/0002-skill-naming-namespace.md` — breaking UX change (minor)

## Super-power: Link related task

Sau khi save ADR, nếu đang trong task folder (check `.dw/tasks/*/tracking.md` có reference đến decision này không):

1. Append vào `tracking.md` section Changelog: `Referenced: ADR-{NNNN}`
2. Update `spec.md` frontmatter `related_adr: ADR-{NNNN}` nếu chưa có
