# Quick Guide: Claude CLI cho Dev lần đầu dùng Terminal

> Dành cho dev quen Claude Code Desktop / Cursor IDE, lần đầu chuyển sang CLI.
> Living doc - cập nhật dần khi dùng thực tế.

---

## 1. Khởi động

```bash
# Mở terminal (cmd / powershell / git bash) → cd vào project
cd D:\your-project

# Chạy Claude interactive mode
claude
```

Gõ lệnh / hỏi trực tiếp trong session.

## 2. Các lệnh cơ bản

| Lệnh | Tác dụng |
|-------|----------|
| `/help` | Xem hướng dẫn |
| `/compact` | Nén context khi chat dài, tránh tràn bộ nhớ |
| `/clear` | Xóa toàn bộ conversation, bắt đầu lại |
| `/cost` | Xem token đã dùng + chi phí |
| `Escape` | Hủy response đang generate |
| `Ctrl+C` | Thoát claude (bấm 2 lần nếu bị kẹt) |

## 3. Workflow thường dùng

### Hỏi về code
```
> giải thích file src/auth/login.ts làm gì
> tìm tất cả chỗ gọi API getUserProfile
```

### Sửa code
```
> sửa bug null pointer ở file utils/parser.ts dòng 42
> thêm validation email vào form register
```

### Chạy lệnh terminal
```
> chạy npm test cho tôi
> install package zod
```

Claude sẽ **hỏi xác nhận** trước khi chạy lệnh hoặc sửa file. Bấm `y` để đồng ý.

## 4. Permission Mode

Khi Claude muốn đọc/sửa file hoặc chạy lệnh, bạn sẽ thấy prompt:

| Key | Nghĩa |
|-----|--------|
| `y` | Cho phép lần này |
| `n` | Từ chối |
| `a` | Always allow - cho phép luôn, không hỏi lại |

> **Tip**: Lần đầu cứ bấm `y` từng cái để hiểu Claude đang làm gì. Quen rồi thì dùng `a`.

## 5. Khác biệt so với Desktop / Cursor

| Desktop / Cursor | CLI |
|------------------|-----|
| Click file để mở | Claude tự đọc file, bạn chỉ cần nói tên |
| Diff hiện visual | Diff hiện dạng text trong terminal |
| Panel chat bên cạnh | Chat trực tiếp trong terminal |
| Auto-save | Claude edit trực tiếp vào file luôn |

## 6. Tips & Tricks

### Multiturn workflow
Không cần gõ hết 1 lần. Chat nhiều lượt để refine:
```
> thêm login API
> (Claude làm xong) → giờ thêm error handling cho nó
> (Claude làm xong) → viết test luôn
```

### Resume session
Thoát rồi quay lại tiếp tục:
```bash
claude --resume       # tiếp tục session gần nhất
claude --continue     # alias
```

### Chạy lệnh nhanh (không vào interactive mode)
```bash
# Hỏi 1 câu rồi thoát
claude -p "giải thích file README.md"

# Pipe input - rất mạnh
git diff | claude -p "review code này"
cat error.log | claude -p "tìm root cause"
```

### CLAUDE.md = bộ não project
Tạo file `CLAUDE.md` ở root project. Claude tự đọc mỗi lần khởi động.
Ghi vào: tech stack, conventions, rules, "đừng làm X"...

### Multi-file edit
Cứ nói "sửa cả file A và file B" - Claude xử lý parallel được.

### `/compact` thường xuyên
Khi thấy response chậm hoặc chat đã dài → gõ `/compact` để nén context.

### Nói rõ context
"Sửa file X, function Y, dòng Z" tốt hơn "sửa cái bug kia".

## 7. Gotchas - Những điều cần biết

- Claude **edit trực tiếp file** trên disk, không qua buffer như IDE → review kỹ trước khi approve
- Nếu approve sai → `git checkout -- <file>` hoặc `Ctrl+Z` trong IDE để revert
- Context window có giới hạn → project lớn nên dùng `/compact` và nói rõ scope
- Terminal không có syntax highlighting đẹp như IDE → đọc diff cần chú ý hơn

---

## Notes (cập nhật khi dùng)

<!-- Ghi lại những điều học được khi dùng thực tế -->

