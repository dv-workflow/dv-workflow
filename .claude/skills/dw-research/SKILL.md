---
name: dw-research
description: "Khảo sát và phân tích codebase trước khi lập kế hoạch. Tìm patterns, dependencies, và ảnh hưởng của thay đổi. Dùng khi cần hiểu code trước khi implement."
argument-hint: "[task-name]"
context: fork
agent: researcher
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git log *)"
  - "Bash(git diff *)"
  - "Bash(git show *)"
  - "Bash(git blame *)"
  - "Bash(ls *)"
  - "Bash(wc *)"
---

# Khảo Sát Codebase

Task: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → lấy `paths.tasks` để biết output location.

## Bước 1: Đọc yêu cầu

- Đọc file `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md` nếu đã có mô tả yêu cầu
- Hoặc lấy yêu cầu từ conversation context

## Bước 2: Khảo sát

Thực hiện các bước sau (không cần theo thứ tự cứng):

1. **Tìm files liên quan**: Dùng Glob + Grep để tìm files theo keywords từ yêu cầu
2. **Đọc code**: Đọc các files tìm được, hiểu logic hiện tại
3. **Trace data flow**: Theo dõi luồng dữ liệu từ input → processing → output
4. **Xác định dependencies**:
   - Upstream: modules/APIs mà code hiện tại gọi đến
   - Downstream: modules/APIs gọi đến code hiện tại
5. **Tìm patterns**: Conventions, design patterns đang dùng trong project
6. **Kiểm tra tests**: Đã có test coverage cho khu vực liên quan?
7. **Git history**: Xem lịch sử thay đổi gần đây của files liên quan

## Bước 3: Áp dụng tư duy phản biện

Từ framework `.claude/skills/dw-thinking/THINKING.md`:
- **Giả định**: Những gì đang giả định là đúng? Cần kiểm chứng?
- **Dependencies**: Module nào bị ảnh hưởng nếu thay đổi?
- **Edge cases**: Trường hợp biên nào cần xem xét?
- **Rủi ro**: Rủi ro kỹ thuật, bảo mật, performance?

## Bước 4: Ghi kết quả

Ghi vào `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md` theo cấu trúc:

```markdown
# Context: [Task Name]

## Ngày khảo sát: [date]

## Yêu Cầu Gốc
[Copy yêu cầu]

## Files Liên Quan
| File | Vai trò | Cần thay đổi? | Ghi chú |
|------|---------|----------------|---------|

## Kiến Trúc Hiện Tại
[Mô tả luồng, diagram nếu cần]

## Dependencies
**Upstream**: ...
**Downstream**: ...

## Patterns & Conventions
- [Pattern]: [mô tả]

## Giả Định & Hạn Chế
- Giả định: ...
- Hạn chế: ...
- Chưa rõ: ...

## Test Coverage Hiện Tại
[Có test không? Coverage ở đâu?]

## Ghi Chú
[Bất kỳ thông tin bổ sung]
```

## Bước 5: Tóm tắt

Khi hoàn thành, trả về tóm tắt:
- Số files khảo sát
- Key findings (3-5 bullets)
- Risks & unknowns
- Gợi ý: "Tiếp theo chạy `/dw-plan $ARGUMENTS`"
