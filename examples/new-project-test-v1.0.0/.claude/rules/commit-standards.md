# Commit Standards

## Format
```
<type>(<scope>): <mô tả tiếng Việt hoặc tiếng Anh>

[Body - chi tiết thay đổi, lý do]
[Blank line]
[Footer - breaking changes, references]

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Types
| Type | Khi nào dùng |
|------|-------------|
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Tái cấu trúc, không thay đổi behavior |
| `test` | Thêm/sửa tests |
| `docs` | Tài liệu, comments |
| `chore` | Build, config, dependencies |
| `style` | Format, whitespace (không thay đổi logic) |
| `perf` | Cải thiện performance |

## Quy tắc
- Mỗi commit = 1 subtask hoặc 1 đơn vị logic hoàn chỉnh
- Mô tả ngắn <= 72 ký tự
- Dùng thì hiện tại: "thêm", "sửa", "cập nhật" (không phải "đã thêm")
- KHÔNG commit files chứa secrets (.env, credentials, tokens)
- KHÔNG commit console.log/debugger còn sót

## Branch Naming
```
<type>/<task-name>
```
Ví dụ: `feat/user-auth`, `fix/login-redirect`, `refactor/api-structure`
