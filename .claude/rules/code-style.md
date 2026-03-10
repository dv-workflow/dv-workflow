# Code Style & Conventions

## Nguyên tắc chung
- Đặt tên biến/hàm rõ ràng, tự giải thích (self-documenting)
- Ưu tiên đơn giản, dễ đọc hơn clever code
- Mỗi function làm MỘT việc
- Comments giải thích WHY, không phải WHAT
- Xử lý errors ở đầu function (guard clauses / early return)

## Naming Conventions
- Variables/Functions: camelCase
- Classes/Components: PascalCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case hoặc theo convention của framework
- Directories: kebab-case

## File Organization
- 1 component/class per file (trừ khi strongly related)
- Group imports: external → internal → relative
- Export ở cuối file hoặc inline (nhất quán trong project)

## Error Handling
- KHÔNG swallow errors (catch rỗng)
- Log đủ context để debug (error message, input data, stack)
- Dùng custom error types cho domain errors
- Validate input ở boundary (API, form, external data)

## Testing
- Test file cùng tên với source: `foo.ts` → `foo.test.ts` hoặc `foo.spec.ts`
- Mỗi test case kiểm tra MỘT behavior
- Test name mô tả expected behavior: "should return error when input is empty"
- Arrange → Act → Assert pattern
- KHÔNG mock internal implementation details

## NOTE
Đây là quy tắc mặc định. Team tùy chỉnh theo stack cụ thể của dự án.
Thêm framework-specific rules vào file này hoặc tạo file riêng trong `.claude/rules/`.
