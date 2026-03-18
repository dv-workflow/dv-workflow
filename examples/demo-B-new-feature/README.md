# Demo B: New Feature — Full Team Workflow

**Scenario**: Dự án SaaS task management đang build. PM yêu cầu thêm Google OAuth để tăng conversion rate đăng ký.

**Config**: Level 2 · new-product template · BA + TL + Dev + QC + PM

---

## Roles & Skills Trong Demo Này

```
BA_X          → /requirements google-oauth     (Thu thập yêu cầu)
DEV_X         → /task-init google-oauth         (Khởi tạo docs)
Agent        → /research google-oauth          (Khảo sát codebase)
Agent        → /plan google-oauth              (Lập kế hoạch)
TL_X          → /arch-review google-oauth       (Review kiến trúc)
DEV_X         → /estimate google-oauth          (Estimate: ~8.5h)
QC_X          → /test-plan google-oauth         (Tạo test cases)
DEV_X+Agent   → /execute google-oauth           (Implement TDD)
DEV_X         → /log-work google-oauth          (Ghi effort)
Agent        → /review                         (Code review)
DEV_X         → /commit                         (Smart commit)
PM_X          → /dashboard last-week            (Xem báo cáo)
```

---

## Cấu Trúc

```
demo-B-new-feature/
├── project/                          # Mini Node.js + TypeScript project
│   └── src/
│       ├── auth/auth.service.ts      ← Email auth hiện tại (cần extend)
│       ├── users/user.model.ts       ← User model với Google fields đã thêm
│       └── __tests__/auth.test.ts    ← Tests
│
└── workflow-output/                  # Toàn bộ docs output của workflow
    └── .dw/tasks/google-oauth/
        ├── google-oauth-requirements.md  ← BA tạo với /requirements
        ├── google-oauth-context.md       ← Agent research với /research
        ├── google-oauth-plan.md          ← Agent plan + TL approve với /arch-review
        ├── google-oauth-test-plan.md     ← QC tạo với /test-plan
        └── google-oauth-progress.md     ← Tracking effort, changelog, handoff
```

---

## Luồng Workflow Chi Tiết

### Ngày 1 — Planning (BA + TL)

```bash
# BA_X:
/requirements google-oauth
# → Tạo: google-oauth-requirements.md
# → Điền: user stories, acceptance criteria, business context
# → PM_X review và approve

# DEV_X:
/task-init google-oauth
# → Tạo: .dw/tasks/google-oauth/ với 3 file trống

# Agent (researcher):
/research google-oauth
# → Đọc: src/auth/, src/users/, existing tests
# → Tạo: google-oauth-context.md
# → Findings: passport-google-oauth20 là choice tốt, cần thêm 5 files

# Agent (planner):
/plan google-oauth
# → Đọc: requirements.md + context.md
# → Tạo: google-oauth-plan.md với 5 subtasks, estimate 8.5h
# → DỪNG — chờ TL approve

# TL_X:
/arch-review google-oauth
# → Review plan: CSRF concern, rate limiting thiếu
# → Add note vào plan, APPROVE với conditions
```

### Ngày 1 — Prep (Dev + QC)

```bash
# DEV_X:
/estimate google-oauth
# → Estimate: 8.5h tổng, breakdown per subtask

# QC_X:
/test-plan google-oauth
# → Tạo: google-oauth-test-plan.md
# → 8 test cases + regression checklist + security checklist
```

### Ngày 1-2 — Execution (Dev + Agent)

```bash
# Execute từng subtask, TDD:
/execute google-oauth
# → ST-1: npm install passport, tạo env.ts
#   commit: "chore(auth): add passport + google oauth dependencies"
# → ST-2: Update user.model.ts (viết test trước → FAIL → code → PASS)
#   commit: "feat(users): add googleId, avatarUrl fields + findOrCreateGoogleUser"
# → ST-3: passport.config.ts + loginWithGoogle()
#   commit: "feat(auth): implement google oauth strategy with passport"
# → ST-4: Routes + CSRF + rate limiting
#   commit: "feat(auth): add /auth/google routes with CSRF protection"
# → ST-5: Integration tests
#   commit: "test(auth): add google oauth integration tests"

# Sau mỗi subtask:
/log-work google-oauth
# → Ghi effort vào progress.md
```

### Ngày 2 — Review & Close

```bash
# Code review:
/review
# → reviewer agent check: security OK, tests đủ, conventions tuân thủ
# → 1 Warning: missing JSDoc cho public functions
# → Dev fix → re-commit

# QC_X: Chạy manual test cases theo test-plan

# Final commit:
/commit "feat(google-oauth): implement google oauth login"

# PM_X xem báo cáo:
/dashboard last-week
```

---

## Điểm Nổi Bật Trong Demo Này

### Collaboration thực sự
Mỗi role làm đúng việc của mình:
- BA tập trung vào requirements (không cần biết code)
- TL tập trung vào architecture review (không cần ngồi pair cả ngày)
- QC tập trung vào test scenarios (song song với dev)
- PM đọc dashboard, không cần ask status mỗi ngày

### Context persistence qua sessions
```
Session 1 (Ngày 1): Research + Plan → save vào .dw/tasks/
Session 2 (Ngày 2): /execute → đọc plan.md + context.md → tiếp tục ngay
Session 3 (Sau handoff): Agent mới đọc progress.md → biết ngay đang ở đâu
```

### Số liệu thực tế
- **Estimate**: 8.5h | **Actual**: 6.5h (accuracy: ~85%)
- **Commits**: 5 atomic commits (mỗi subtask 1 commit)
- **Issues phát hiện**: 2 (CSRF thiếu, rate limiting) — cả 2 được fix trong sprint
- **Handoff**: 0 câu hỏi cần hỏi lại nhờ progress.md đầy đủ
