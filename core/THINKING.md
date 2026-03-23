<!-- core-version: 2.0 -->

# Tư Duy Phản Biện, Hệ Thống, Đa Góc Nhìn & First Principles

Framework tư duy cho cả người và AI agent khi research, plan, và implement.

---

## 1. First Principles Thinking

**Mục đích**: Bỏ qua assumptions, trở về câu hỏi cơ bản nhất. Tránh "chúng tôi luôn làm vậy."

### Quy Trình

1. **Decompose**: Tách vấn đề thành các phần cơ bản nhất — không thể tách nhỏ hơn
2. **Question assumptions**: Mỗi assumption: "Điều này có đúng không? Có thể kiểm chứng được không?"
3. **Rebuild**: Từ những gì đã verify, build lại solution từ đầu
4. **Compare**: Solution mới có ưu việt hơn solution cũ không? Tại sao?

### Câu Hỏi First Principles

- "Vấn đề thực sự cần giải quyết là gì?" (không phải symptom)
- "Nếu không có bất kỳ constraint nào, solution tốt nhất là gì?"
- "Constraint nào là thực sự hard, constraint nào là assumed?"
- "Ai đang được served bởi solution này? Họ thực sự cần gì?"

---

## 2. Tư Duy Phản Biện (Critical Thinking)

**Mục đích**: Không chấp nhận giả định một chiều. Đặt câu hỏi, xem xét rủi ro, phương án thay thế.

### Câu Hỏi Khi Research & Plan

- **Giả định**: Những giả định nào đang coi là đúng? Nếu sai thì ảnh hưởng thế nào?
- **Bằng chứng**: Kết luận dựa trên đâu (code, doc, đo lường)? Thiếu bằng chứng ở đâu?
- **Edge cases**: Trường hợp biên nào có thể làm hỏng thiết kế? (null, empty, concurrent, rollback)
- **Rủi ro**: Rủi ro kỹ thuật, vận hành, bảo mật? Xác suất và tác động?
- **Phương án thay thế**: Còn cách nào khác? Trade-off so với approach hiện tại?
- **Phản diện (Devil's advocate)**: Lý do mạnh nhất để KHÔNG làm theo approach đang chọn?
- **Đơn giản hơn**: Có cách nào đơn giản hơn đạt cùng mục tiêu không?

### Áp Dụng Trong Task

- **Research**: Ghi rõ "Giả định", "Hạn chế đã biết", "Chưa rõ / cần kiểm chứng"
- **Plan**: Có mục "Rủi ro & Giả định" và "Phương án đã xem xét"
- **Execute**: Phát hiện giả định sai → DỪNG, ghi Changelog, cập nhật plan

---

## 3. Tư Duy Hệ Thống (Systems Thinking)

**Mục đích**: Xem task trong bối cảnh hệ thống lớn. Dependencies, tác động lan truyền, failure modes.

### Các Khía Cạnh Cần Xem Xét

- **Dependencies**: Task này phụ thuộc vào gì? Ai phụ thuộc vào kết quả của task này?
- **Boundaries**: Ranh giới rõ ràng chưa? Interfaces ổn định chưa?
- **Data flow**: Dữ liệu đi từ đâu đến đâu? Thêm DB/cache/queue? Consistency?
- **Feedback loops**: Thay đổi có tạo vòng lặp không? Cần giới hạn hay debounce?
- **Failure modes**: Một phần lỗi → hệ thống còn lại ứng xử thế nào? Graceful degradation?
- **Scale**: Khi tải tăng, điểm nghẽn ở đâu? N+1 queries, missing indexes, locks?

### Áp Dụng Trong Task

- **Research**: Mô tả (hoặc diagram) luồng hiện tại và vị trí của task
- **Plan**: Mục "Tác động hệ thống" — modules bị ảnh hưởng, API changes, migration
- **Subtasks**: Tách rõ schema / service / route / frontend để review dependencies

---

## 4. Đa Góc Nhìn (Multiple Perspectives)

**Mục đích**: Tránh optimize cho một role. Cân bằng nhu cầu nhiều bên liên quan.

### Bảng Góc Nhìn

| Góc nhìn | Câu hỏi điển hình |
|----------|-------------------|
| **End user** | Dễ dùng không? Feature có match use case thực tế? |
| **Developer** | Code dễ đọc, test được không? API nhất quán? |
| **Security** | Ai được làm gì? Có lộ data không? Auth/authz đúng? Rate limit? |
| **Ops/Vận hành** | Deploy thế nào? Migration cần gì? Metric/log/debug khi lỗi? |
| **Business/Product** | Giải quyết đúng pain point chưa? Ship được từng phần? |
| **Ngắn hạn vs dài hạn** | Ship nhanh vs kiến trúc bền vững. Tech debt chấp nhận được không? |

### Áp Dụng Trong Task

- **Plan**: Mục "Góc nhìn & Trade-offs" — mỗi quyết định lớn, ghi tác động per role
- **Acceptance criteria**: Có thể tách "User: ...", "Dev: ...", "Security: ..."
- **Review**: Nếu chỉ đúng về kỹ thuật nhưng bỏ qua security/ops → bổ sung

---

## 5. Checklist Nhanh (Trước Khi Kết Thúc Mỗi Phase)

### Research

- [ ] Đã ghi giả định và có thể sai không?
- [ ] Đã ghi những gì chưa rõ / cần kiểm chứng?
- [ ] Đã identify failure modes của kiến trúc hiện tại?

### Plan

- [ ] Đã xem xét ≥2 approaches và so sánh trade-offs?
- [ ] Có mục Rủi ro & Giả định?
- [ ] Có mục Edge cases?
- [ ] Có mục Tác động hệ thống?
- [ ] Đã xem xét ≥2 góc nhìn (user, security, dev, ops)?
- [ ] Devil's advocate: lý do mạnh nhất để không làm approach này?

### Execute

- [ ] Có assumption nào bị chứng minh sai? → Ghi Changelog, cập nhật plan
- [ ] Có scope thay đổi? → Cập nhật plan, hỏi human

---

## 6. Prompt Gợi Ý Cho Agent

Khi giao task cho AI agent:

> "Khi làm task này, áp dụng framework trong `core/THINKING.md`:
> - Trước khi viết plan, liệt kê: (1) giả định đang dùng, (2) 2 rủi ro chính, (3) 1 phương án thay thế đã loại và lý do
> - Xem xét tác động lên ít nhất 2 góc nhìn (vd: user + security)
> - Nếu phát hiện giả định sai trong khi execute → dừng, ghi Changelog, hỏi"
