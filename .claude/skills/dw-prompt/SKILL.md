---
name: dw-prompt
description: "Improve a vague task description into a clear, actionable prompt. Uses git log + recent dw tasks for project context. Output is concise — human dev will refine further."
argument-hint: "[task description] [--vi]"
---

# Prompt Builder

Input: **$ARGUMENTS**

## Bước 0 — Parse options

- Nếu `$ARGUMENTS` chứa `--vi`: output bằng **tiếng Việt**, bỏ flag `--vi` ra khỏi description
- Mặc định: output bằng **tiếng Anh**

## Bước 1 — Lấy context từ git log

Extract 1–2 keywords chính từ description (bỏ qua stop words: fix, add, feat, the, a, in, of).

Chạy **cả hai** để có context tốt nhất:

```bash
# Tìm commits liên quan theo keyword
git log --oneline --no-merges --all --grep="<keyword1>" -15
git log --oneline --no-merges --all --grep="<keyword2>" -15

# Fallback: 30 commits gần nhất
git log --oneline --no-merges -30
```

Dùng kết quả để nhận ra: module names, naming conventions, commit style của project.

## Bước 2 — Lấy context từ dw tasks gần đây

Đọc danh sách task đang/đã làm:

```bash
ls .dw/tasks/
```

Nếu có task liên quan đến keyword → đọc file `*-progress.md` để hiểu thêm context (scope, decisions, findings).

## Bước 3 — Improve prompt

**Nếu $ARGUMENTS rỗng (sau khi bỏ flags):** hỏi ngắn "Describe your task:" trước.

**Rules:**
- **1–2 dòng tối đa** — human dev sẽ tự sửa thêm
- Giữ: **what** + **scope** (nếu rõ từ context) + **outcome** (nếu rõ)
- Active voice, present tense: "Fix...", "Add...", "Refactor..."
- Không bullet points, không markdown headers trong output
- Match naming conventions từ git log nếu nhận ra được

## Output format

```
─── Improved prompt ──────────────────────
<1–2 line improved prompt>
──────────────────────────────────────────
```

Không thêm gì khác ngoài block trên.
