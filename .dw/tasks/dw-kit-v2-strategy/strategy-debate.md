# Adversarial Debate: dw-kit v2.0 Strategy

## Ngày: 2026-04-20
## Model: claude-opus-4-7 (cả hai bots)
## Format: Red-bot (attack) vs Blue-bot (defend + strengthen)

---

# RED-BOT OUTPUT

## 1. Assumption Attacks

**A1. "Permission prompts là pain point thực sự"**
Root cause có thể là devs chưa trust AI đủ. Giảm prompts bằng cách loosen safety → họ sẽ complain về bugs từ AI chạy tự do. Pain point thật: "Tôi không biết khi nào nên trust". Giải pháp đúng: prompts có context rõ ràng hơn, không phải ít prompts hơn.

**A2. "Thin shell = ít token hơn = tốt hơn"**
Với prompt caching (5-min TTL) và context window 1M tokens, verbose rules inject một lần rồi cache — cost marginal gần như zero. Devs feel "rườm rà" vì visual noise trong output, không phải token economics.

**A3. "Task docs optional sẽ được adopt nhiều hơn"**
Ngược lại: Optional = không ai dùng. Human behavior: opt-in systems → adoption ~5-15%. Mandatory với friction thấp → 60-80%. Làm optional = tự giết feature có thể là differentiator lớn nhất vs Cursor rules.

**A4. "Dual audience khả thi với cùng codebase"**
Product axiom: không thể serve 2 audiences với ROI model khác nhau cùng một SKU. Two presets = mọi feature phải thiết kế 2 lần, maintenance cost x2, cả hai bị compromise.

**A5. "Claude Code là nền tảng stable"**
Anthropic có thể sunset Claude Code, force migration sang Agent SDK, hoặc đổi hook/skill API breaking. dw-kit đang đặt toàn bộ bet trên surface không phải của mình kiểm soát.

## 2. "Thin harness" Risk

**Native memory từ Claude Code:** Context layer của dw-kit có thể obsolete trong 6-12 tháng. dw-kit còn ~18 tháng runway trước khi core value bị absorb.

**Team mới join:** v1.x prescriptive workflow thực ra là teaching tool disguised as automation. Loại bỏ nó = loại bỏ giá trị onboarding. TechLead phải tự build training materials.

**AI hallucinate không guardrails:** Safety layer chỉ catch destructive file ops, không catch logic errors, spec drift, security issues trong code.

## 3. Open Source Adoption Risk

Vibe coders không download npm package để có "safety + memory shell". Họ dùng Cursor/Windsurf vì zero config, IDE-native.

Competitor analysis:
- Cursor Rules: 1 file markdown, zero structure — win on simplicity
- GitHub Copilot Workspaces: native IDE, no install — win on distribution
- Cline/Roo: memory bank + task system, UI-driven trong VSCode — tương đương dw-kit

dw-kit's moat thực: Vietnamese-first docs + Vietnamese dev workflow. Đi global → moat biến mất.

## 4. "Design for Obsolescence" — 3 Failure Modes

**FM1:** Mọi feature đều fail test "Claude v3 làm tốt hơn không?" → theo logic này dw-kit nên xóa chính nó ngay hôm nay.

**FM2:** Đánh đồng "AI làm được" với "nên để AI làm". Explicit docs là governance artifact, không phải AI limitation workaround. Team audits, compliance, handoffs cần human-readable artifacts.

**FM3:** Defensive mindset. Winning products hỏi ngược: *"Feature nào VALUABLE HƠN khi AI mạnh hơn?"*
- AI mạnh hơn → effort estimation accuracy tăng → `/dw-estimate` valuable hơn
- AI mạnh hơn → cần audit trail tốt hơn → task docs valuable hơn
- AI mạnh hơn → multi-agent orchestration → role system valuable hơn

## 5. Biggest Blind Spot: Observability & Failure Recovery

Chiến lược không đề cập:
- Khi AI output sai trong production → làm sao trace back session nào, context gì?
- Khi task corrupt → rollback mechanism ngoài git?
- Sau 6 tháng → metrics gì về quality/velocity để justify tool's existence?
- TechLead review 10 devs dùng AI → audit/dashboard gì để spot patterns đáng lo?

dw-kit hiện là **write-only system** — inject context vào, không thu gì ra.

**Red Team Verdict:** Chiến lược v2.0 đang retreating thành commodity layer. "Thin harness" = race to zero value. Dual audience là product management sin.

**Reframe:** dw-kit v2.0 = **"AI-assisted SDLC governance layer"** — target team only. OSS là marketing, không phải audience. Cursor/Copilot không làm được governance vì họ là IDE tools.

---

# BLUE-BOT OUTPUT

## 1. Core Value — Điều Đang Bị Underestimate

3 thứ AI mạnh hơn KHÔNG xóa được:

**a) Team coordination là human problem.** Context layer (project-map, decisions log) là shared brain cho team + AI — giá trị tăng theo số dev, không giảm theo AI capability.

**b) Safety là compliance, không phải convenience.** Với team 10 devs × AI coding velocity cao, xác suất leak tăng exponentially. Safety layer không obsolete khi AI smarter — chỉ obsolete khi Claude Code tự build in (chưa thấy dấu hiệu).

**c) Institutional memory vs session memory.** Decisions từ 3 tháng trước, tradeoffs đã thảo luận, roles — cần persistence layer bên ngoài AI. Đây là moat thật.

## 2. "Thin Harness" Hidden Strengths

**Low cognitive load = cao adoption.** Dev join team đọc 5 phút `.claude/rules/` là hiểu conventions.

**AI-agnostic.** Nếu team chuyển từ Claude sang Cursor/Windsurf — context layer + safety hooks vẫn port được. Workflow engine v1.x dính chặt vào Claude Code.

**Fail gracefully.** Thin = ít surface area = ít bug = dev không mất trust.

**Shared artifacts.** Context layer serve cả human lẫn AI. Workflow scripts chỉ serve AI. Thin harness tối ưu cho shared artifact.

## 3. Open Source — Preset "Solo" Là Killer Feature

Solo devs cần safety nhất (không có code review) + memory (nhiều side projects). Sweet spot chưa ai serve:
- Cursor Rules: chỉ rules, không safety/memory
- Claude Skills: fragmented, không curated

**Để win:**
1. `npx dw-kit init --solo` — 1 command, xong 10 giây
2. Zero required docs cho solo preset
3. privacy-block + pre-commit-gate bật mặc định
4. Templates cho common stacks (Next.js, FastAPI, Expo)
5. Viral hook: safety story ("dw-kit vừa chặn tôi leak OpenAI key")
6. Distinct identity: solo không phải "team preset bị cắt"

## 4. "Design for Obsolescence" — Defense

**Signal trust.** Tool nào cũng claim future-proof. Nói thẳng "nếu AI tốt hơn feature này nên biến mất" = honest = build trust.

**Force quality filter.** Mỗi reject = tránh bloat. Đây là product discipline.

**Reveals obsolescence-resistant features:** safety hooks, team config, decision log = survive. Workflow scripts = không survive.

**Correct bet.** 6 tháng tới Claude 5, GPT-5 ra. Tool over-engineer workflow sẽ bị rewrite. Tool bet vào context + safety sẽ survive.

## 5. Incremental (D1) — Defense

2 teams × 10 devs đã adopt v1.x. Clean slate = breaking trust. Incremental = educate users trong khi migrate.

Clean slate justified khi: user base <100 (chưa đến), architecture fundamentally incompatible (chưa), tech debt crushing (chưa).

## 6. Biggest Missed Opportunity: `.dw/decisions/` — ADR Layer

**Architecture Decision Records với AI integration = unique moat.**

Tại sao:
- Highest-value artifact cho AI + dev mới: AI không biết WHY → wrong decisions
- Obsolescence-proof tuyệt đối: AI càng mạnh càng cần WHY context
- Team coordination: TL approval traceable, không phải Slack thread bị quên
- ADR là pattern validated (Thoughtworks, Spotify) — dw-kit package hóa + AI integration = unique

```
.dw/decisions/
├── 0001-use-postgres.md
├── 0002-auth-jwt.md
└── template.md
```

- `/dw-decision [title]` — prompt fill in context/options/consequences
- Auto-inject relevant decisions khi task touches related module
- Hook: AI suggest architectural change → check conflict với existing decision → flag

**Promote decisions layer thành pillar thứ 4:**
**Memory + Safety + Decisions + Team Config**

**Blue Team Verdict:** Chiến lược v2.0 đúng hướng, cần strengthen:
1. Solo preset = primary growth channel, không phải afterthought
2. Decisions layer = pillar, không phải side feature
3. Rebrand "thin harness" → "context-first harness"
