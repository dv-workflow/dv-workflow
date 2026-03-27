# Context: hello-world-3d

## Ngày khảo sát: 2026-03-25
## Người thực hiện: agent

---

## Yêu Cầu Gốc

> "best FE hello world with 3d design lean - quickly and auto random"
>
> Tạo một frontend Hello World tốt nhất với thiết kế 3D, phong cách lean/minimalist, chạy nhanh và có hiệu ứng random tự động.

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Cần thay đổi? | Ghi chú |
|---|------|---------|----------------|---------|
| 1 | index.html | Entry point | Tạo mới | Single-file app |
| 2 | style.css | Styles | Tạo mới | Lean/minimal |
| 3 | main.js | Logic 3D + random | Tạo mới | Three.js hoặc CSS 3D |

### Kiến Trúc Hiện Tại

```
Dự án mới — chưa có codebase
```

### Data Flow

- **Input**: Không có — auto random
- **Processing**: Random seed → 3D animation parameters
- **Output**: Canvas/DOM 3D scene với "Hello World"
- **Storage**: Không cần — stateless

## Dependencies

### Upstream
- [ ] Three.js (CDN) — 3D rendering

### Downstream
- Không có

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ (file:line) |
|---------|--------|--------------------|
| Lean design | Minimal, clean, whitespace | — |
| Auto random | Random colors/rotation on load | — |

## Test Coverage Hiện Tại

- [ ] Có tests? Không (static page)
- Test files: N/A
- Coverage: N/A
- Gaps: Visual/manual check

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | Single HTML file, no build tool | Không | Dùng Vite nếu cần |
| 2 | Three.js từ CDN | Không | Import local |
| 3 | "Auto random" = random màu + rotation mỗi lần load | Không | Điều chỉnh |

## Hạn Chế Đã Biết
- Không có backend
- Mobile performance cần kiểm tra

## Chưa Rõ / Cần Làm Rõ
- [x] Framework: Three.js vs CSS 3D transforms — chọn Three.js cho wow-factor

## Ghi Chú Bổ Sung

Task scope rất nhỏ (≤3 files), phù hợp với depth quick/standard. Dùng Three.js cho 3D thực sự, không chỉ CSS transform. Random tự động: mỗi load sẽ random màu, tốc độ rotation, và vị trí text.
