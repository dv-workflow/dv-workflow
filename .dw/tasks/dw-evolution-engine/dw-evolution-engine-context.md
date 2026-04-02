# Context: dw-evolution-engine

## Ngày khảo sát: 2026-03-30
## Người thực hiện: TechLead (huygdv) + agent

---

## Yêu Cầu Gốc

> dw-kit cần cơ chế để tiến hóa liên tục và chất lượng cao:
> - Thu thập feedback từ ~10 devs (2 teams) khi họ dùng dw trong user repos
> - Xử lý feedback bằng adversarial agents (white-bot/black-bot cross-evaluate)
> - Ship improvements qua npm release — users nhận qua `dw upgrade`
> - Lean: không overhead cho dev, không block workflow

## Project Context

| | Chi tiết |
|---|---|
| dw-kit maintainer | TechLead (huygdv) — phát triển dw-kit, tương lai OSS |
| User repos | 2 dev teams, ~10 devs, dự án hiện tại + mới |
| Distribution | npm package `dw-kit` |
| GitHub | `dv-workflow/dv-workflow` |
| dw version hiện tại | 1.1.0 |

## Vấn Đề Cốt Lõi

**Entropic decay**: Không có gì đảm bảo dw tốt hôm nay sẽ tốt mãi. Rules tích lũy, friction tăng, dev bypass, dw trở thành dead letter.

**Creator bias**: TechLead tạo rules → có xu hướng bảo vệ chúng. Cần cơ chế tách "người đề xuất" và "người phán xét".

**Bottleneck**: Nếu TL phải manually review mọi feedback từ 10 devs → không scale.

## Kiến Trúc: dw Evolution Engine

```
[USER REPOS - 10 devs]          [GITHUB dv-workflow]     [DW-KIT REPO]
       │                                │                      │
  Gặp friction/bug                      │                      │
       │                                │                      │
  /dw-[feedback-skill]                  │                      │
  auto-capture context                  │                      │
       │──── gh issue create ─────────► Issue #N              │
       │                                │                      │
       │                          label: type+component        │
       │                                │                      │
       │                                │◄── TL: /dw-evolve #N│
       │                                │                      │
       │                         [white-bot] propose           │
       │                         [black-bot] critique ◄── cross-eval
       │                         [synthesis] recommend         │
       │                                │                      │
       │                                │◄── TL approve → PR  │
       │                                │                      │
  dw upgrade ◄──────── npm publish ◄────────────────────────── │
```

## Adversarial Processing — Tại Sao Cross-Eval?

Dựa trên pattern của Claude Code: subagent đánh giá output của subagent khác → giảm hallucination vì:
- Agent A không "defend" proposal của mình trước Agent B
- Agent B không có attachment → honest critique
- Blind spots của A được catch bởi B

Áp dụng cho dw: white-bot propose fix → black-bot tìm edge cases → TL review debate ngắn gọn thay vì phân tích từ đầu.

## Phân Loại Skills Theo Deployment

| Skill | Nằm ở | Ship npm? | Dùng bởi |
|-------|--------|-----------|---------|
| `/dw-kit-report` | `.claude/skills/` | ✓ Yes | Devs trong user repos |
| `/dw-kit-evolve` | `.claude/skills/` | ✗ No (.npmignore) | TechLead trong dw-kit repo |
| `/dw-kit-audit` | `.claude/skills/` | ✗ No (.npmignore) | TechLead trong dw-kit repo |

**Lý do tách biệt**: User repos chỉ cần gửi feedback. Evolution processing là internal tooling của dw maintainer — không liên quan đến user workflow.

## Feedback Lifecycle

```
OPEN:    Issue tạo → label "needs-evolve-review"
PROCESS: /dw-evolve chạy → debate comment → label "white-bot-proposed" / "black-bot-reviewed"
DECIDE:  TL approve → PR → merge → label "resolved"
RELEASE: npm publish → user chạy `dw upgrade` → nhận improvement
AUDIT:   Quarterly /dw-audit → pattern analysis → propose rule changes
```

## Core Principles — Immutable (không thể retire)

Hardcoded trong `/dw-kit-evolve`, black-bot không được propose retire:
1. Research trước code sau (cho task phức tạp)
2. Commit nhỏ — mỗi subtask 1 commit
3. Config-driven behavior

## Real Use Cases Đã Xảy Ra (Evidence)

| Dev | Feedback | Kết quả |
|-----|----------|---------|
| namph | Cần giữ original Claude cho một số prompts | → `--no-dw` flag (v1.1.0) |
| hainv | `hooks/post-write.sh line 5: $'\r': command not found` trên Ubuntu | → CRLF fix (pending) |

Hai cases này xảy ra **ad-hoc qua chat** — evolution engine sẽ structure hóa luồng này.

## Giả Định Quan Trọng

| # | Giả định | Kiểm chứng | Fallback |
|---|----------|------------|---------|
| 1 | Dev cài `gh` CLI | TB — không phải mặc định | Print text + manual link |
| 2 | GitHub Issues đủ structured cho agents | Cao — có template | Template enforce |
| 3 | TL có thời gian chạy `/dw-kit-evolve` per Issue | TB — risky | `/dw-kit-audit` batch quarterly |
| 4 | 10 devs thực sự dùng feedback skill | Cần validate | Low friction design |

## Câu Hỏi Đang Xem Xét

- [x] Tên feedback skill: chọn `/dw-kit-report` — explicit "kit" = về dw-kit tool, không nhầm với in-session feedback
