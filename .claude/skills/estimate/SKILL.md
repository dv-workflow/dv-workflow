---
name: dw-estimate
description: "Ước lượng effort cho task. Phân tích subtasks từ plan và đưa ra estimate theo đơn vị cấu hình (hours/story-points/t-shirt). Dùng sau /plan."
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Ước Lượng Effort

Task: **$ARGUMENTS**

## Đọc Config

Đọc `config/dw.config.yml`:
- `flags.estimation` — nếu `false` → thông báo "Estimation chưa bật" và DỪNG
- `estimation.unit` → đơn vị (hours / story-points / t-shirt)
- `estimation.categories` → các loại công việc cần estimate
- `paths.tasks` → location task docs

## Điều Kiện

Nếu chưa có plan (`{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`) → thông báo cần chạy `/dw-plan` trước.

## Quy Trình Estimation

### 1. Đọc plan & context
- Đọc toàn bộ subtasks
- Đọc context để hiểu technical complexity
- Hiểu dependencies giữa subtasks

### 2. Estimate từng subtask

Với mỗi subtask, phân tích:
- **Complexity**: Low / Medium / High
  - Low: Rõ ràng, ít dependencies, code cũ đã có pattern
  - Medium: Cần thiết kế, có vài dependencies
  - High: Phức tạp, nhiều unknowns, cần research thêm
- **Uncertainty**: Low / Medium / High (có unknown chưa giải quyết?)
- **Estimate**: Dựa trên complexity + uncertainty

**Reference nhanh (hours):**
| Complexity | Low uncertainty | Medium | High uncertainty |
|-----------|-----------------|--------|-----------------|
| Low | 1-2h | 2-4h | 4-8h |
| Medium | 2-4h | 4-8h | 8-16h |
| High | 4-8h | 8-16h | 16-40h |

**Reference (story points - Fibonacci):** 1, 2, 3, 5, 8, 13, 21
**Reference (t-shirt):** XS(<2h), S(2-4h), M(4-8h), L(8-16h), XL(16-40h), XXL(>40h)

### 3. Uncertainty buffer

- Low uncertainty overall: +0%
- Medium: +20%
- High: +50%
- Nhiều unknowns / first-time tech: +100% (double)

### 4. Breakdown theo categories

```
Research:      [X]
Planning:      [done]
Coding:        [X per subtask]
Testing:       [X — thường 20-30% coding]
Review:        [X — thường 10-15% coding]
Documentation: [X — nếu living docs bật]
Buffer:        [X%]
Total:         [sum]
```

## Ghi Vào Plan

Cập nhật phần "Estimation Tổng" trong plan file.

## Trình Bày

```markdown
## Estimation Summary: $ARGUMENTS

| Subtask | Complexity | Uncertainty | Estimate |
|---------|-----------|-------------|---------|
| ST-1 | Low | Low | 2h |
| ST-2 | Medium | Medium | 6h |

**Total Estimate**: X hours (với buffer Y%)
**Confidence**: High / Medium / Low
**Risk note**: [nếu có unknowns lớn]
```
