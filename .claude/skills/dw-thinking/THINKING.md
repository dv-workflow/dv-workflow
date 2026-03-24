# Tư Duy Phản Biện, Hệ Thống & Đa Góc Nhìn

Tài liệu này hướng dẫn cách áp dụng **tư duy phản biện tích cực**, **tư duy hệ thống** và **đa góc nhìn** khi lập kế hoạch, nghiên cứu và triển khai tasks — dùng cho cả người và agent.

---

## 1. Tư duy phản biện tích cực (Critical Thinking)

**Mục đích:** Không chấp nhận giả định một chiều; đặt câu hỏi, xem xét rủi ro và phương án thay thế để ra quyết định tốt hơn.

### 1.1 Câu hỏi nên đặt khi đọc/viết Research & Plan

- **Giả định:** Những giả định nào đang được coi là đúng? Nếu sai thì ảnh hưởng thế nào?
- **Bằng chứng:** Kết luận dựa trên đâu (code, doc, đo lường)? Thiếu bằng chứng ở đâu?
- **Edge case:** Trường hợp biên nào có thể làm hỏng thiết kế (user xóa, group đổi, đồng thời, rollback)?
- **Rủi ro:** Rủi ro kỹ thuật, vận hành, bảo mật nào? Xác suất và tác động?
- **Phương án thay thế:** Còn cách nào khác đạt mục tiêu? Trade-off so với phương án hiện tại?
- **Ngược lại:** Nếu *không* làm tính năng này thì sao? Có cách nào đơn giản hơn (workaround, process thủ công)?

### 1.2 Áp dụng trong task

- Trong **Research**: Ghi rõ "Giả định", "Hạn chế đã biết", "Chưa rõ / cần kiểm chứng".
- Trong **Plan**: Có mục **Rủi ro & Giả định** và **Phương án thay thế đã xem xét**; **Edge cases / Điều kiện bất thường** cần xử lý.
- Khi **thực hiện**: Nếu phát hiện giả định sai hoặc rủi ro mới → dừng lại ghi vào Changelog/Notes và (nếu cần) cập nhật plan.

---

## 2. Tư duy hệ thống (Systems Thinking)

**Mục đích:** Xem task trong bối cảnh hệ thống lớn: phụ thuộc, tác động lan truyền, ranh giới, vòng lặp phản hồi.

### 2.1 Các khía cạnh cần xem xét

- **Phụ thuộc (Dependencies):** Task này phụ thuộc vào module/API/data nào? Ai phụ thuộc vào kết quả của task này (frontend, tích hợp, cron)?
- **Biên giới (Boundaries):** Ranh giới rõ ràng giữa "bên trong task" và "bên ngoài" (upstream, admin, bên thứ ba)? Giao diện (API, schema) ổn định chưa?
- **Luồng dữ liệu:** Dữ liệu đi từ đâu đến đâu? Có thêm DB, cache, queue không? Consistency và thứ tự cập nhật?
- **Tác động ngược (Feedback):** Thay đổi có tạo vòng lặp không (vd: share → notification → user vào share → lại trigger)? Cần giới hạn hoặc debounce?
- **Failure mode:** Một phần hệ thống lỗi thì task/hệ thống còn lại ứng xử thế nào (graceful degradation, rollback, alert)?
- **Scale & performance:** Khi số lượng share/recipient/user tăng, điểm nghẽn ở đâu (query N+1, index, lock)?

### 2.2 Áp dụng trong task

- **Plan** có mục **Tác động hệ thống**: danh sách module/API bị ảnh hưởng; migration/backward compatibility.
- **Research** nên vẽ (hoặc mô tả) luồng hiện tại và vị trí task trong bức tranh lớn.
- **Subtasks** tách rõ "thay đổi schema", "thay đổi service", "thay đổi route", "ảnh hưởng frontend" để dễ review dependency.

---

## 3. Đa góc nhìn (Multiple Perspectives)

**Mục đích:** Tránh tối ưu cho một vai duy nhất; cân bằng nhu cầu của nhiều bên liên quan và bối cảnh khác nhau.

### 3.1 Các góc nhìn gợi ý

| Góc nhìn | Câu hỏi điển hình |
|----------|--------------------|
| **End user** | Dễ dùng không? Hiểu rõ feature vs use cases? Thu hồi có rõ ràng không? |
| **Admin** | Quản lý share/recipient toàn hệ thống thế nào? Audit, abuse (spam share)? |
| **Developer / Maintainer** | Code dễ đọc, dễ test không? API nhất quán với phần còn lại? |
| **Ops / Vận hành** | Backup, restore, migration? Log, metric, debug khi lỗi? |
| **Bảo mật** | Ai được xem/tải gì? Lộ gì? lộ metadata? Rate limit, audit log? |
| **Sản phẩm / Business** | Giải quyết đúng pain point chưa? Có thể launch từng phần (phase1, phase2,...)? |
| **Thời gian:** ngắn hạn vs dài hạn | Ship nhanh vs kiến trúc bền vững; tech debt có chấp nhận tạm không? |

### 3.2 Áp dụng trong task

- Trong **Plan**: mục **Góc nhìn & Trade-off** — với mỗi quyết định lớn, ghi ngắn tác động lên user / admin / dev / security.
- **Acceptance criteria** có thể tách: "User: ...", "Admin: ...", "Security: ...".
- Khi **review** hoặc **agent thực hiện**: nếu chỉ làm đúng "yêu cầu kỹ thuật" mà bỏ qua góc admin/security → nhắc bổ sung.

---

## 4. Checklist nhanh khi tạo/cập nhật task

- [ ] **Research:** Đã ghi giả định, hạn chế, chưa rõ?
- [ ] **Plan:** Có mục Rủi ro & Giả định, Phương án thay thế, Edge cases?
- [ ] **Plan:** Có mục Tác động hệ thống (module, API, migration)?
- [ ] **Plan:** Có xem xét ít nhất 2–3 góc nhìn (user, admin, security hoặc dev)?
- [ ] **Subtasks:** Thứ tự có tính đến dependency và failure mode không?
- [ ] **Changelog:** Khi giả định sai hoặc rủi ro mới xuất hiện, đã ghi lại chưa?

---

## 5. Gợi ý prompt cho Agent

Khi giao task cho agent, có thể thêm:

- "Khi làm task nên áp dụng kết hợp tư duy trong `.claude/skills/dw-thinking/THINKING.md`: xem xét rủi ro và edge case, tác động lên các module khác, và ít nhất 2 góc nhìn (vd: user + security). Nếu phát hiện giả định sai hoặc thiếu, ghi vào Notes/Changelog của task."
- "Trước khi implement, liệt kê ngắn: (1) giả định đang dùng, (2) 2 rủi ro chính, (3) 1 phương án thay thế đã loại và lý do."

Như vậy agent vừa làm đúng spec vừa bổ sung tư duy phản biện và hệ thống vào doc, giúp người review và task sau có thêm ngữ cảnh.
