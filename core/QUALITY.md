<!-- core-version: 2.0 -->

# Quality Strategy — 4-Layer Framework

> **Nguyên tắc**: Quality là constant. Ceremony adapts.
> Không có "quality level" — chỉ có depth phù hợp với context.

---

## Overview

```
Layer 1: Requirements Clarity   → trước khi code
Layer 2: Test-Driven Development → trong khi code
Layer 3: Cross-Review           → sau khi code
Layer 4: Automated Gates + QA   → trước khi merge
```

Mỗi layer build on top of layer trước. Skip layer sớm → vấn đề phát sinh muộn hơn với chi phí cao hơn.

---

## Layer 1: Requirements Clarity (Trước Khi Code)

**Mục tiêu**: Đảm bảo hiểu đúng và đủ TRƯỚC khi bắt đầu implement.

### Given/When/Then Format

Mỗi feature/subtask nên có acceptance criteria theo format:

```
Given [trạng thái ban đầu / precondition]
When  [hành động / trigger]
Then  [kết quả mong đợi / postcondition]
```

Ví dụ:
```
Given user đã đăng nhập và có items trong cart
When user logout rồi login lại
Then cart items vẫn còn nguyên
```

### Checklist Requirements Clarity

- [ ] Business logic được mô tả bằng Given/When/Then
- [ ] Edge cases được identify upfront (không phải sau khi code xong)
- [ ] Acceptance criteria per subtask: testable và specific (không mơ hồ)
- [ ] Out-of-scope được ghi rõ (tránh scope creep)
- [ ] Nếu có TL: TL đã review requirements trước khi dev bắt đầu

### Red Flags

- Acceptance criteria dùng "should work" / "hoạt động đúng" — không đo lường được
- Edge cases không được hỏi khi plan, chỉ phát hiện khi test
- "Tôi hiểu rồi" mà không có written acceptance criteria

---

## Layer 2: Test-Driven Development (Trong Khi Code)

**Mục tiêu**: Tests là specification, không phải afterthought.

### TDD Cycle Per Subtask

```
RED   → Viết test trước (failing) — test mô tả behavior mong muốn
GREEN → Implement tối thiểu để test pass — không over-engineer
REFACTOR → Cải thiện code structure, không thay đổi behavior
COMMIT → Một subtask = một commit
```

### Test Coverage Priorities

1. **Happy path**: nominal flow với input hợp lệ
2. **Error cases**: invalid input, missing data, permission denied
3. **Edge cases**: boundary values, empty collections, concurrent operations
4. **Regression**: verify fixed bugs không tái xuất hiện

### Test Naming Convention

```
should [expected behavior] when [condition]

Ví dụ:
- should return empty cart when user has no items
- should throw AuthError when token is expired
- should preserve cart when user re-logs in
```

### Checklist TDD

- [ ] Test file tạo TRƯỚC khi implement
- [ ] Test fail first (RED) đã verify
- [ ] Implement minimal để pass (GREEN)
- [ ] Refactor nếu code smell (không thay đổi tests)
- [ ] Coverage: happy + error + edge cases
- [ ] Tests independent (không phụ thuộc thứ tự run)
- [ ] Không mock internal implementation — chỉ mock external boundaries

---

## Layer 3: Cross-Review (Sau Khi Code)

**Mục tiêu**: Phát hiện issues mà người viết không thấy.

### TL Architecture Review (nếu có techlead)

Tập trung vào:
- Architecture decisions đúng không? Có alternatives tốt hơn?
- Patterns nhất quán với codebase không?
- Scalability và performance implications?
- Security design đúng không?

Output: Approve hoặc Request Changes với lý do cụ thể.

### Peer Code Review Checklist

```
CORRECTNESS
[ ] Logic đúng? Edge cases handled?
[ ] Error handling đầy đủ? Logged đủ context?
[ ] No silent failures

SECURITY
[ ] Input validation ở boundaries?
[ ] No SQL injection / XSS / command injection?
[ ] Auth/authz checks đúng?
[ ] No sensitive data in logs/responses

PERFORMANCE
[ ] N+1 queries?
[ ] Missing indexes?
[ ] Unnecessary loops trong hot path?

MAINTAINABILITY
[ ] Naming rõ ràng, self-documenting?
[ ] Functions làm 1 việc?
[ ] No dead code?
[ ] Complex logic có comment (WHY, không WHAT)?

TESTS
[ ] Tests cover happy path + error + edge cases?
[ ] Test names mô tả behavior?
[ ] No flaky tests?
```

### A/B Testing Cho Uncertain Decisions

Khi có 2 approaches và không rõ approach nào tốt hơn:
1. Prototype cả 2 (minimal implementation)
2. So sánh: performance, readability, testability, maintainability
3. TL decide và ghi lý do vào task docs
4. Loại bỏ prototype không chọn

### Review Output Format

Reviewer phân loại theo mức độ:

| Mức độ | Ký hiệu | Ý nghĩa |
|--------|---------|---------|
| Critical | 🔴 | Phải sửa trước khi merge. Block merge. |
| Warning | 🟡 | Nên sửa. Không block nhưng ưu tiên cao. |
| Suggestion | 🔵 | Cân nhắc. Không block. |
| Positive | ✅ | Ghi nhận điểm tốt. |

---

## Layer 4: Automated Gates + QA Confirmation (Trước Merge)

**Mục tiêu**: Machine-verifiable checks và human QA sign-off.

### Automated Gates

Chạy tự động, block nếu fail (nếu `block_on_fail: true`):

```bash
# Quality check script
{quality.test_command}    # unit + integration tests
{quality.lint_command}    # code style + static analysis
```

Mandatory (luôn chạy, không configurable):
- No debug code: `console.log`, `debugger`, `var_dump`, `dd()`
- No sensitive data: passwords, API keys, tokens trong diff

### QA Confirmation (thorough depth + có qc role)

QA không phải developer — QA là independent verification:

1. QA nhận test plan (từ Phase 3)
2. QA verify acceptance criteria từ Layer 1
3. QA chạy regression checklist
4. QA sign-off là **explicit gate** — không implied, không assumed
5. Nếu QA find issues → developer fix → QA re-verify

### Merge Checklist

Trước khi merge PR:

- [ ] Layer 1: Tất cả acceptance criteria pass
- [ ] Layer 2: Tests pass locally và CI
- [ ] Layer 3: Code review approved (0 CRITICAL, warnings resolved hoặc acknowledged)
- [ ] Layer 4: Automated gates pass + QA sign-off (nếu required)
- [ ] No debug code, no sensitive data
- [ ] Commit messages follow convention
- [ ] Branch up to date với main

---

## Quality Anti-Patterns

| Anti-pattern | Vấn đề | Fix |
|-------------|--------|-----|
| Tests sau khi code xong | Tests được viết để match implementation, không verify behavior | Test-first |
| Mock everything | Tests pass nhưng integration fails | Chỉ mock external boundaries |
| "It works on my machine" | Không có automated gate | CI/CD + pre-commit hooks |
| Skip review vì "urgent" | Bugs slip to production, harder to fix | Fast review còn tốt hơn no review |
| LGTM without reading | Review là ceremony, không quality gate | Structured checklist |
| QA là formality | Issues found late, expensive to fix | QA reviews against acceptance criteria |
