---
name: dw-debug
description: "Debug có hệ thống theo quy trình Investigate → Diagnose → Fix. Dùng khi gặp lỗi, test fail, hoặc behavior bất thường."
argument-hint: "[mô tả vấn đề]"
---

# Debug Có Hệ Thống

Vấn đề: **$ARGUMENTS**

## Đọc Config

Đọc `config/dw.config.yml` → `flags.debug`. Nếu `false` → thông báo và DỪNG.

---

## Phase 1: INVESTIGATE — Thu thập thông tin

### 1.1 Xác định symptoms
- Error message đầy đủ là gì? (stack trace, log)
- Reproduction steps: làm gì để trigger lỗi?
- Xảy ra lần đầu khi nào? Có gì thay đổi gần đây?
- Tần suất: always / flaky / one-time?
- Môi trường: dev / staging / production?

### 1.2 Thu thập evidence
```bash
# Git: thay đổi gần đây
git log --oneline -10
git diff HEAD~3

# Tìm error trong code
grep -r "[error keyword]" --include="*.ts"
```

### 1.3 Xác định phạm vi
- Feature nào bị ảnh hưởng?
- Chỉ 1 user hay tất cả?
- Data cụ thể nào trigger lỗi?

---

## Phase 2: DIAGNOSE — Tìm root cause

### 2.1 Đặt giả thuyết
Liệt kê 2-4 giả thuyết có thể về nguyên nhân, ưu tiên từ khả năng cao nhất.

### 2.2 Kiểm chứng từng giả thuyết
- Đọc code liên quan
- Trace data flow
- Kiểm tra config, environment variables
- Xem test coverage có bỏ sót case này không

### 2.3 Thu hẹp phạm vi
- Loại trừ dần từng giả thuyết
- Tìm exact line/function gây lỗi
- Xác định root cause (không phải symptom)

---

## Phase 3: FIX — Sửa và verify

### 3.1 Implement fix tối thiểu
- Fix đúng root cause, không phải workaround
- Không thay đổi scope ngoài bug fix

### 3.2 Viết regression test TRƯỚC khi fix
```
// Test phải FAIL trước fix, PASS sau fix
test("should handle [edge case that caused bug]", () => { ... })
```

### 3.3 Verify
- Test mới pass
- Existing tests không bị break
- Manual verify reproduction steps

### 3.4 Ghi lại

```markdown
## Debug Report

**Root Cause**: [giải thích ngắn gọn]
**Fix**: [mô tả thay đổi]
**Prevention**: [làm sao tránh lặp lại]
**Test added**: [tên test]
```

---

## Khi Bị Bí

Nếu sau 2 giả thuyết vẫn không tìm được root cause:
1. Mô rộng hơn: xem toàn bộ data flow
2. Thêm logging tạm thời để narrow down
3. Bisect git: `git bisect` để tìm commit gây lỗi
4. Hỏi: trình bày findings cho user, propose next steps
