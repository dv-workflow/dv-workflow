# dw-kit Evolution Flow

Tài liệu này mô tả cách dw-kit tiến hóa từ feedback của người dùng thực.

---

## Tổng Quan

```
[User repos]          [GitHub]               [dw-kit repo]
     │                    │                       │
  Gặp vấn đề             │                       │
  /dw-kit-report    ──►  Issue created            │
                          │                       │
                          │  ◄── /dw-kit-evolve ──│ (TechLead)
                          │                       │
                     Adversarial debate            │
                     white-bot + black-bot         │
                          │                       │
                          │  ◄── TL approve ───── │
                          │           PR merged    │
                          │                       │
  dw upgrade ◄──── npm publish ◄──────────────────│
```

---

## Layer 1: Feedback Collection (User Repos)

### Khi nào dùng `/dw-kit-report`

Khi gặp vấn đề với **dw-kit tool** — không phải với code của project bạn:

| Dùng `/dw-kit-report` | Không dùng |
|-----------------------|-----------|
| Hook báo lỗi CRLF | Code review cho feature của bạn |
| Skill `/dw-plan` thiếu use case | Debug bug trong project |
| Workflow phase quá nặng với context cụ thể | Feedback về code Claude viết |
| Muốn suggest tính năng mới cho dw | Hỏi về cách dùng dw |

### Cách dùng

```
/dw-kit-report hooks/post-write.sh fails on Ubuntu with CRLF error
/dw-kit-report research phase is too heavy when fixing a 1-file typo
/dw-kit-report suggest: add timeout option for long-running hooks
```

Skill tự động:
- Detect OS, dw version, task context
- Classify: bug | gap | friction | suggestion
- Tạo GitHub Issue trên `dv-workflow/dv-workflow`
- Fallback nếu không có `gh` CLI

---

## Layer 2: Adversarial Processing (dw-kit Repo)

### `/dw-kit-evolve [issue#]`

TechLead chạy khi có Issue mới cần xử lý:

```
/dw-kit-evolve 42
```

**Triage tự động:**

```
Simple bug (hooks/config, non-blocking)
  → white-bot propose fix → TL approve → PR

Complex (gap/friction/suggestion hoặc blocking bug)
  → white-bot (Subagent A): propose solution [isolated]
  → black-bot (Subagent B): critique proposal [sees A's output]
  → Synthesis comment trên Issue
  → TL review debate → decide
```

**Tại sao 2 subagents?**

Subagent A không "defend" proposal của mình trước Subagent B.
Subagent B không có attachment → honest critique.
Blind spots của A được catch bởi B → chất lượng cao hơn 1 agent.

**Core Principles được bảo vệ** — không thể propose retire:
- Research trước code sau (task phức tạp)
- Commit nhỏ
- Config-driven behavior

---

## Layer 3: Pattern Review (dw-kit Repo)

### `/dw-kit-audit [90]`

Chạy quarterly (hoặc khi cần):

```
/dw-kit-audit 90
```

Đọc closed Issues trong 90 ngày → group patterns → output report tại `.dw/reports/audit-[date].md`

**Pattern threshold:** 3+ Issues cùng component+type → flag để TechLead xem xét thay đổi systemic.

**Verdicts:** `rule-change` | `new-feature` | `docs-fix` | `retire` | `no-action`

**Retire rule** chỉ khi: 3+ issues report friction + usage < 30% trong kỳ.

---

## Label Lifecycle

```
Issue created
  └─► [needs-evolve-review]
           │
  /dw-kit-evolve runs
           │
     ┌─────┴──────┐
     │            │
[white-bot-    [black-bot-
 proposed]      reviewed]
     └─────┬──────┘
           │
      [tl-review]
           │
     TL decides
     └─► closed (resolved / won't fix / duplicate)
```

---

## Immutable Core Principles

Những nguyên tắc sau không bao giờ được thay đổi qua evolution process.
Chúng là foundation của dw — adversarial agents sẽ block mọi proposal retire/modify:

1. **Research trước code sau** — cho task ≥3 files
2. **Commit nhỏ** — mỗi subtask = 1 commit
3. **Config-driven** — behavior driven by `.dw/config/dw.config.yml`

Muốn challenge một core principle → tạo Issue riêng với label `core-principle-challenge`
và cung cấp evidence từ ít nhất 5 real use cases.

---

## Nhận Updates

Sau khi TechLead merge PR từ evolution process:

```bash
dw upgrade
```

hoặc:

```bash
npm update dw-kit
```
