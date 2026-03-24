# Examples — dv-workflow-kit

Thư mục này chứa ví dụ thực tế về cách áp dụng dv-workflow-kit vào dự án Node.js + TypeScript.

---

## Tổng Quan

| # | Ví dụ | Loại | Workflow | Độ phức tạp |
|---|-------|------|----------|-------------|
| A | [demo-A-bug-fix](./demo-A-bug-fix/) | Bug Fix | `/debug` → `/commit` | 1-2 files |
| B | [demo-B-new-feature](./demo-B-new-feature/) | New Feature (Full Team) | Full workflow | 6 files |
| — | [integration-guide](./integration-guide/) | Setup | Git submodule setup | — |

---

## Demo A — Bug Fix (Old Project / Maintenance)

**Scenario**: Khách hàng báo lỗi giỏ hàng bị mất sau khi đăng nhập.

**Stack**: Express + TypeScript + express-session

**Workflow áp dụng** (Level 1 — old-maintenance config):
```
/debug bug-cart-lost-after-login
  → Investigate: đọc auth.middleware.ts, cart.service.ts
  → Diagnose: session.regenerate() không restore cart
  → Fix: thêm mergeGuestCart() sau regenerate()
/commit "fix(auth): preserve cart after login"
```

**Xem**:
- [Workflow output](./demo-A-bug-fix/workflow-output/) — context + progress docs
- [Buggy code](./demo-A-bug-fix/project/src/auth/auth.middleware.ts)
- [Regression test](./demo-A-bug-fix/project/src/__tests__/cart.test.ts)
- [README chi tiết](./demo-A-bug-fix/README.md)

**Kết quả**: 2 commits, estimate 2h → actual 50 phút, bug fix với regression test.

---

## Demo B — New Feature (Full Team / new-product)

**Scenario**: SaaS app cần thêm Google OAuth để tăng conversion rate đăng ký.

**Stack**: Express + TypeScript + Passport.js

**Team tham gia**: BA_X + TL_X + DEV_X+Agent + QC_X

**Workflow áp dụng** (Level 2 — new-product config):
```
BA:    /requirements google-oauth   → google-oauth-requirements.md
Dev:   /task-init google-oauth      → tạo bộ docs
Dev:   /research google-oauth       → google-oauth-context.md (researcher agent)
Dev:   /estimate google-oauth       → 8.5h estimate
Dev:   /plan google-oauth           → google-oauth-plan.md (5 subtasks)
TL:    /arch-review google-oauth    → approve + security notes
QC:    /test-plan google-oauth      → 8 test cases (TC-001 → TC-008)
Dev:   /execute google-oauth        → implement ST-1 → ST-5 (TDD)
Dev:   /review                      → code review report
Dev:   /commit                      → 5 atomic commits
Dev:   /handoff                     → handoff notes (nếu cần)
```

**Xem**:
- [Workflow output](./demo-B-new-feature/workflow-output/) — tất cả 5 docs
- [Project code](./demo-B-new-feature/project/src/) — auth.routes.ts, user.model.ts, test
- [README chi tiết](./demo-B-new-feature/README.md)

**Kết quả**: Estimate 8.5h → Actual 6.5h (77%), 5 atomic commits, 0 câu hỏi khi handoff.

---

## Integration Guide — Cách Tích Hợp Vào Dự Án Thực

Hướng dẫn từng bước để add dv-workflow-kit vào dự án của bạn qua **Git Submodule**:

```bash
# 1. Add submodule
git submodule add https://github.com/YOUR_ORG/dv-workflow-kit .dv-workflow

# 2. Chạy setup
bash .dw-module/integration-guide/setup.sh new-product

# 3. Cấu hình
# Sửa .dw/config/dw.config.yml: project.name, level, roles, flags

# 4. Bắt đầu
claude  # → /config-init hoặc /task-init [task-name]
```

**Xem thêm**:
- [setup.sh](./integration-guide/setup.sh) — Script tự động hóa
- [README chi tiết](./integration-guide/README.md) — Hướng dẫn đầy đủ với FAQ

---

## So Sánh Hai Demo

| Tiêu chí | Demo A (Bug Fix) | Demo B (New Feature) |
|----------|-----------------|---------------------|
| Level config | 1 (outsource) | 2 (new-product) |
| Roles | Dev only | BA + TL + Dev + QC |
| Docs tạo ra | 2 (context + progress) | 5 (requirements + context + plan + test-plan + progress) |
| Workflow | `/debug` → `/commit` | Full 10-step workflow |
| Files thay đổi | 2 | 6 |
| Thời gian | 50 phút | 6.5 giờ |
| Commits | 2 | 5 |

---

## Cấu Trúc Thư Mục

```
examples/
├── demo-A-bug-fix/
│   ├── project/                    # Mini Express project (có bug thật)
│   │   └── src/
│   │       ├── auth/auth.middleware.ts   # Bug location
│   │       ├── cart/cart.service.ts
│   │       └── __tests__/cart.test.ts   # Regression test
│   ├── workflow-output/
│   │   └── .dw/tasks/bug-cart-lost-after-login/
│   │       ├── ...-context.md      # Research findings
│   │       └── ...-progress.md     # Debug trace + effort log
│   └── README.md
│
├── demo-B-new-feature/
│   ├── project/                    # Mini SaaS app (Google OAuth)
│   │   └── src/
│   │       ├── auth/               # auth.service.ts, auth.routes.ts
│   │       ├── users/user.model.ts
│   │       └── __tests__/auth.test.ts   # 5 test cases
│   ├── workflow-output/
│   │   └── .dw/tasks/google-oauth/
│   │       ├── ...-requirements.md  # BA doc
│   │       ├── ...-context.md       # Research
│   │       ├── ...-plan.md          # 5 subtasks + TL approval
│   │       ├── ...-test-plan.md     # 8 test cases
│   │       └── ...-progress.md     # Effort log + handoff
│   └── README.md
│
└── integration-guide/
    ├── setup.sh                    # Bash setup script
    └── README.md                   # Step-by-step guide
```
