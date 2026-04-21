---
name: dw:thinking
description: "Áp dụng framework tư duy phản biện, hệ thống và đa góc nhìn vào vấn đề. Auto-load khi planning hoặc khi cần phân tích sâu. Dùng proactively."
argument-hint: "[vấn đề cần phân tích]"
user-invocable: true
---

# Framework Tư Duy — Áp Dụng Vào Task

Vấn đề: **$ARGUMENTS**

## Nạp Framework

@THINKING.md

---

## Áp Dụng Vào Task Hiện Tại

Sau khi đọc framework trên, áp dụng vào vấn đề `$ARGUMENTS`:

### 1. Tư Duy Phản Biện

**Giả định đang dùng:**
- [ ] [Giả định 1] — Cách kiểm chứng: ...
- [ ] [Giả định 2]

**Rủi ro chính (top 3):**
1. [Rủi ro] — Xác suất: Cao/TB/Thấp — Tác động: ...
2. ...
3. ...

**Phương án thay thế đã loại:**
- [Phương án A] — Loại vì: ...

**Edge cases cần xử lý:**
- [ ] [Edge case 1]

### 2. Tư Duy Hệ Thống

**Dependencies:**
- Upstream: [ai/module gì phụ thuộc vào]
- Downstream: [bị ảnh hưởng bởi thay đổi này]

**Tác động cascade:**
- Nếu thay đổi X → Y bị ảnh hưởng → Z cần cập nhật

**Failure modes:**
- [Nếu phần A fail → hệ thống phản ứng thế nào]

### 3. Đa Góc Nhìn

| Góc nhìn | Câu hỏi | Đánh giá |
|----------|---------|----------|
| User | [Ảnh hưởng UX?] | [OK / Concern] |
| Developer | [Maintainable?] | |
| Security | [Expose gì?] | |
| Ops | [Deploy issues?] | |
| Business | [Giá trị delivered?] | |

### 4. Kết Luận

**Quyết định:**
[Approach được chọn và lý do]

**Trade-offs chấp nhận:**
[Điểm yếu nào của approach này được chấp nhận]

**Điểm cần monitor:**
[Theo dõi gì sau khi implement]
