# Plan: dw-evolution-engine

## Ngày tạo: 2026-03-30
## Trạng thái: Draft — chờ approve
## Approved by: —

---

## Kiến Trúc Tổng Quan — Trả Lời 3 Câu Hỏi

### Q1: 3 skills mới phục vụ repo nào?

```
DW-KIT REPO                          USER REPOS (qua npm)
────────────────────────────         ────────────────────
/dw-feedback   ──── ships ────────►  /dw-feedback  ✓
/dw-evolve     ──── KHÔNG ship ───►  (không có)
/dw-audit      ──── KHÔNG ship ───►  (không có)
```

- `/dw-kit-report`: ship theo npm → devs dùng để gửi feedback VỀ dw
- `/dw-kit-evolve` + `/dw-kit-audit`: **maintainer-only** → chỉ trong dw-kit repo, TL dùng khi xử lý feedback

### Q2: Evolution không ship → user repos không có?

**Đúng và đó là thiết kế đúng.** User repos chỉ cần:
- Dùng dw để làm việc
- Gửi feedback khi gặp vấn đề (`/dw-kit-report`)

dw-kit maintainer (TechLead) xử lý evolution nội bộ rồi **ship kết quả qua npm release**. User repos nhận improvement thông qua `dw upgrade`, không cần biết evolution internals.

```
User experience:
  Tháng 1: dw v1.1.0 — có một số friction
  /dw-feedback "research quá nặng cho hotfix"

  Tháng 2: dw v1.2.0 — routing được cải thiện
  dw upgrade  →  done, không cần làm gì thêm
```

### Q3: Flow đầy đủ

```
[USER REPOS]                [GITHUB]              [DW-KIT REPO]
     │                          │                       │
     │  /dw-feedback            │                       │
     │ ──────────────────────►  Issue created           │
     │                          │                       │
     │                          │  TL: /dw-evolve #N    │
     │                          │ ◄─────────────────────│
     │                          │                       │
     │                     white-bot comment            │
     │                     black-bot critique           │
     │                     synthesis recommendation     │
     │                          │                       │
     │                          │  TL approve → merge   │
     │                          │ ◄─────────────────────│
     │                          │                       │
     │  dw upgrade              │   npm publish         │
     │ ◄────────────────────────────────────────────────│
     │                          │                       │
```

---

## Tóm Tắt Giải Pháp

dw-evolution-engine là **vòng lặp tiến hóa có cấu trúc** cho dw-kit. Devs gửi feedback qua `/dw-kit-report` → GitHub Issues → TL xử lý bằng `/dw-kit-evolve` (adversarial subagents) → merge → npm release → users nhận improvement.

Maintainer skills (`/dw-kit-evolve`, `/dw-kit-audit`) được giữ khỏi npm bằng `.npmignore`.

---

## Subtasks

### ST-1: `.npmignore` cho maintainer skills

- **Mô tả**: Tạo `.npmignore` exclude `/dw-kit-evolve` và `/dw-kit-audit` khỏi npm package. Phân biệt rõ maintainer skills vs user skills.
- **Files**:
  - `.npmignore` (tạo mới)
- **Acceptance Criteria**:
  - [ ] `/dw-kit-evolve` và `/dw-kit-audit` không có trong `npm pack` output
  - [ ] `/dw-kit-report` vẫn có trong npm package
- **Dependencies**: none

### ST-2: `/dw-kit-report` skill (ships with npm)

- **Mô tả**: Skill chạy trong user repos. Auto-capture context → format structured Issue → `gh issue create` lên dw-kit repo. Fallback nếu `gh` không có. Tên rõ ràng: "report vấn đề về dw-kit tool", không nhầm với feedback cho agents trong conversation.
- **Files**:
  - `.claude/skills/dw-kit-report/SKILL.md` (tạo mới)
- **Acceptance Criteria**:
  - [ ] Nhận description từ `$ARGUMENTS`
  - [ ] Auto-detect: OS, dw version, component từ keywords
  - [ ] Classify: `bug | gap | friction | suggestion`
  - [ ] `gh issue create --repo dv-workflow/dv-workflow` với structured body
  - [ ] Fallback: print formatted text + link tạo Issue thủ công
  - [ ] In Issue URL sau khi tạo
- **Dependencies**: ST-1

### ST-3: GitHub Issue template + labels

- **Mô tả**: Issue template cho dw-kit repo đảm bảo feedback có structure. Labels để triage tự động.
- **Files**:
  - `.github/ISSUE_TEMPLATE/dw-feedback.yml` (tạo mới)
- **Labels cần tạo trên GitHub** (thủ công hoặc qua `gh label create`):
  - `type: bug`, `type: gap`, `type: friction`, `type: suggestion`
  - `component: hooks`, `component: skills`, `component: config`, `component: workflow`
  - `status: needs-evolve-review`, `status: white-bot-proposed`, `status: black-bot-reviewed`
- **Acceptance Criteria**:
  - [ ] Template match format từ `/dw-kit-report` output
  - [ ] Labels tồn tại trên GitHub repo
- **Dependencies**: ST-2

### ST-4: `/dw-kit-evolve` skill (maintainer-only)

- **Mô tả**: TL chạy khi có Issue mới. Dùng 2 subagents: white-bot (propose) và black-bot (critique). Output: comment debate trên Issue + recommendation.
- **Files**:
  - `.claude/skills/dw-kit-evolve/SKILL.md` (tạo mới)
- **Acceptance Criteria**:
  - [ ] Nhận Issue number từ `$ARGUMENTS`
  - [ ] Đọc Issue bằng `gh issue view`
  - [ ] Triage: `simple bug` → propose fix trực tiếp; `gap/friction/suggestion` → full adversarial
  - [ ] **Simple bug**: white-bot propose PR → TL review
  - [ ] **Complex**: white-bot (Subagent A) propose → black-bot (Subagent B) critique → synthesis comment
  - [ ] Comment kết quả lên Issue với label update
  - [ ] Core principles list hardcoded — không thể propose retire
- **Dependencies**: ST-3

### ST-5: `/dw-kit-audit` skill (maintainer-only)

- **Mô tả**: Quarterly review. Đọc closed Issues → group patterns → propose rule changes hoặc retirements → TL approve/reject.
- **Files**:
  - `.claude/skills/dw-kit-audit/SKILL.md` (tạo mới)
- **Acceptance Criteria**:
  - [ ] Query Issues closed trong N ngày (`gh issue list --state closed`)
  - [ ] Group theo component + type
  - [ ] Pattern detection: 3+ Issues cùng component/type → flag
  - [ ] Output: markdown report với verdict per pattern (keep/modify/retire)
  - [ ] TL annotate report → becomes input cho next dw release
- **Dependencies**: ST-4

### ST-6: Docs — update CLAUDE.md + README

- **Mô tả**: Document `/dw-kit-report` trong CLAUDE.md skills table. Thêm section evolution flow trong README/docs.
- **Files**:
  - `CLAUDE.md` (thêm `/dw-kit-report` vào skills table)
  - `.dw/docs/evolution-flow.md` (tạo mới — how dw evolves)
- **Acceptance Criteria**:
  - [ ] Dev mới đọc CLAUDE.md biết cách gửi feedback
  - [ ] evolution-flow.md giải thích rõ user repo → GitHub → dw-kit flow
- **Dependencies**: ST-2

---

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | Dev cài `gh` CLI | TB | Thấp — có fallback | Print text + link |
| 2 | Rủi ro | black-bot quá aggressive → retire rules tốt | TB | TB | Threshold: 3+ Issues + TL final approval |
| 3 | Rủi ro | TL không có thời gian chạy `/dw-kit-evolve` → Issues tồn đọng | Cao | TB | `/dw-kit-audit` định kỳ batch-process thay vì per-Issue |
| 4 | Giả định | GitHub Issues đủ structured cho agents | Có | Cao | Issue template (ST-3) enforce structure |

## Edge Cases

- `gh` không có → `/dw-kit-report` fallback print text
- Issue không dùng template (free text) → `/dw-kit-evolve` vẫn process, confidence thấp hơn, note trong comment
- Core principles bị propose retire → `/dw-kit-evolve` hardblock với message rõ ràng
- Duplicate Issues → `/dw-kit-audit` detect và suggest close as duplicate

## Tác Động Hệ Thống

| Scope | Thay đổi | Breaking? |
|-------|----------|-----------|
| npm package | Thêm `/dw-kit-report`, exclude maintainer skills | Không |
| dw-kit repo | Thêm 2 maintainer skills, GitHub templates | Không |
| User repos | Thêm `/dw-kit-report` khi `dw upgrade` | Không |
| CLAUDE.md | Thêm 1 dòng skills table | Không |

---

## Dependency Graph

```
ST-1 (.npmignore)
  └── ST-2 (/dw-feedback)
        ├── ST-3 (GitHub templates)
        │     └── ST-4 (/dw-evolve)
        │           └── ST-5 (/dw-audit)
        └── ST-6 (Docs)
```
