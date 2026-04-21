---
name: dw:test-plan
description: "QC skill: Tạo test plan cho feature/task. Bao gồm test cases, edge cases, regression checklist. Dùng sau khi plan được approve."
argument-hint: "[task-name | feature-name]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Tạo Test Plan

Feature/Task: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → `paths.tasks`, `workflow.default_depth`.
Skill này dành cho depth: `standard` hoặc `thorough` (QC role).

## Đọc Tài Liệu Liên Quan

1. Đọc requirements: `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-requirements.md` (nếu có)
2. Đọc plan: `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`
3. Đọc context: `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md`

## Tạo Test Plan

Ghi ra `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-test-plan.md`:

```markdown
# Test Plan: [Feature/Task Name]

## Ngày: [date] | QC: [name] | Status: Draft

## Scope
**In scope**: [Những gì sẽ được test]
**Out of scope**: [Những gì KHÔNG test]
**Test environment**: [dev / staging]

## Test Strategy
- [ ] Unit testing (dev responsibility)
- [ ] Integration testing
- [ ] Manual functional testing (QC)
- [ ] Regression testing
- [ ] Performance testing (nếu cần)
- [ ] Security testing (nếu cần)

---

## Test Cases

### TC-001: [Happy Path - Tên mô tả]
- **Preconditions**: [Điều kiện trước]
- **Steps**:
  1. [Bước 1]
  2. [Bước 2]
- **Expected Result**: [Kết quả mong đợi]
- **Priority**: P1 Critical / P2 High / P3 Medium / P4 Low
- **Status**: Not Run / Pass / Fail / Blocked

### TC-002: [Edge Case]
...

### TC-00N: [Negative Test]
...

---

## Regression Checklist

Các tính năng hiện có có thể bị ảnh hưởng bởi thay đổi này:
- [ ] [Feature A] — Test: [quick test steps]
- [ ] [Feature B]

---

## Performance Criteria (nếu applicable)
| Metric | Target | Actual |
|--------|--------|--------|
| Page load | < 2s | |
| API response | < 500ms | |

---

## Bug Report Template

```markdown
**Bug**: [Tiêu đề ngắn gọn]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1.
**Expected**:
**Actual**:
**Environment**: [OS, Browser, Version]
**Screenshot**: [đính kèm]
```

---

## Sign-off Criteria
- [ ] Tất cả P1 test cases PASS
- [ ] Không có open Critical/High bugs
- [ ] Regression checklist clear
- [ ] Performance criteria met
```

## Thông Báo

Sau khi tạo:
- "Test plan sẵn sàng: [path]"
- Gợi ý cho dev: "Review test cases để đảm bảo unit tests cover các scenarios này"
- Gợi ý cho TL: "Review có cần thêm test cases nào không"
