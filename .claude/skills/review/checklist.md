# Code Review Checklist

Dùng checklist này khi review code. Phân loại mỗi issue tìm được.

---

## 🔴 Critical — Phải sửa trước khi merge

### Correctness
- [ ] Logic có đúng với requirements không?
- [ ] Có lỗi off-by-one, null pointer, type mismatch?
- [ ] Race conditions hoặc concurrency issues?
- [ ] Data loss scenarios (delete không có confirm, overwrite không safe)?

### Security
- [ ] Input validation đầy đủ (SQL injection, XSS, path traversal)?
- [ ] Authentication & authorization đúng ở mọi endpoint?
- [ ] Sensitive data không bị log, expose qua API, hoặc lưu plain text?
- [ ] Secrets/credentials không hardcode trong code?
- [ ] CORS, rate limiting, CSRF được xử lý đúng?

### Data Integrity
- [ ] Database transactions dùng đúng chỗ?
- [ ] Foreign key constraints được tôn trọng?
- [ ] Migration có rollback plan?

---

## 🟡 Warning — Nên sửa

### Performance
- [ ] Có N+1 query problem không? (loop gọi DB từng item)
- [ ] Index database cho các query thường xuyên?
- [ ] Tải file/data lớn có streaming/pagination?
- [ ] Cache được dùng hợp lý (không over-cache, không under-cache)?

### Error Handling
- [ ] Mọi error đều được catch và xử lý?
- [ ] Error messages có đủ context để debug không?
- [ ] API trả về đúng HTTP status code?
- [ ] Không có empty catch blocks?

### Code Quality
- [ ] Functions quá dài (>50 lines) hoặc làm nhiều hơn 1 việc?
- [ ] Code duplication đáng kể (>3 lần) không có abstraction?
- [ ] Magic numbers/strings chưa được đặt tên?
- [ ] Dead code, commented-out code còn sót?

### Testing
- [ ] Happy path được test?
- [ ] Edge cases được test (empty, null, max value)?
- [ ] Error paths được test?
- [ ] Test có mock internal implementation không? (nên tránh)

---

## 🔵 Suggestion — Cân nhắc

### Readability
- [ ] Naming rõ ràng, tự giải thích?
- [ ] Complex logic có comment giải thích WHY?
- [ ] Imports được organize (external → internal → relative)?

### Maintainability
- [ ] Có thể test được (testability)?
- [ ] Dependencies được inject thay vì hardcode?
- [ ] Breaking changes được document?

### Conventions
- [ ] Tuân thủ `.claude/rules/code-style.md`?
- [ ] File structure nhất quán với phần còn lại của project?
- [ ] Commit message đúng format?

---

## ✅ Điểm Tốt Cần Ghi Nhận

[Ghi lại những pattern tốt, approaches thông minh, hoặc improvements đáng khen]

---

## Severity Scale

| Level | Mô tả | Action |
|-------|--------|--------|
| 🔴 Critical | Security issue, data loss, logic sai | Phải fix trước merge |
| 🟡 Warning | Performance, maintainability, error handling | Nên fix, có thể negotiate |
| 🔵 Suggestion | Style, readability, nice-to-have | Cân nhắc, không bắt buộc |
