# Plan: hello-world-3d

## Ngày tạo: 2026-03-25

## Trạng thái: Approved

## Approved by: user

---

## Tóm Tắt Giải Pháp

Tạo một trang HTML đơn (single-file) hiển thị "Hello World" 3D dùng Three.js với phong cách lean/minimalist. Mỗi lần load trang, các tham số visual (màu sắc, tốc độ quay, background) được random tự động để tạo trải nghiệm độc đáo.

Stack: HTML + CSS + Three.js (CDN) — zero build tools, zero dependencies ngoài Three.js.

## Phương Án Đã Xem Xét


| #   | Phương án         | Ưu điểm                    | Nhược điểm         | Chọn?               |
| --- | ----------------- | -------------------------- | ------------------ | ------------------- |
| 1   | Three.js 3D Text  | Thực sự 3D, wow-factor cao | Cần font loader    | **Chọn**            |
| 2   | CSS 3D transforms | Zero deps                  | Không phải 3D thực | Loại — không đủ wow |
| 3   | WebGL raw         | Full control               | Quá phức tạp       | Loại — overkill     |


## Subtasks

### ST-1: Setup HTML skeleton + Three.js

- **Mô tả**: Tạo `index.html` với Three.js CDN, canvas fullscreen, meta tags
- **Files**: `index.html`
- **Acceptance Criteria**:
  - Three.js load từ CDN (importmap hoặc script tag)
  - Canvas fullscreen, responsive
  - Dark background lean
- **Dependencies**: none
- **Estimate**: 0.5h

### ST-2: 3D Scene + Random Parameters

- **Mô tả**: Setup Three.js scene, camera, renderer. Random: background color palette, text color, rotation speed, camera distance
- **Files**: `index.html` (inline script)
- **Acceptance Criteria**:
  - Scene render được trên canvas
  - Random seed khác nhau mỗi load
  - Smooth animation loop
- **Dependencies**: ST-1
- **Estimate**: 1h

### ST-3: 3D "Hello World" Text

- **Mô tả**: Dùng Three.js TextGeometry với font từ CDN, render chữ "Hello World" 3D, rotation animation
- **Files**: `index.html` (inline script)
- **Acceptance Criteria**:
  - Text "Hello World" hiện đúng trong 3D
  - Text tự rotate (random speed)
  - Bevel/depth effect lean
- **Dependencies**: ST-2
- **Estimate**: 1h

### ST-4: Lean UI polish + Effects

- **Mô tả**: Thêm subtle particle background, ambient glow, minimal CSS overlay info text. Polish overall look
- **Files**: `index.html` (inline style + script)
- **Acceptance Criteria**:
  - Particles ambient (≤100 particles, lean không cluttered)
  - Responsive layout
  - Smooth 60fps
- **Dependencies**: ST-3
- **Estimate**: 0.5h

## Rủi Ro & Giả Định


| #   | Loại     | Mô tả                            | Xác suất | Tác động | Giảm thiểu                 |
| --- | -------- | -------------------------------- | -------- | -------- | -------------------------- |
| 1   | Rủi ro   | TextGeometry cần font load async | TB       | Thấp     | Dùng fallback spinner      |
| 2   | Giả định | Three.js CDN available           | Thấp     | Cao      | Pin version cụ thể         |
| 3   | Rủi ro   | Mobile GPU performance           | Thấp     | TB       | Giảm particles trên mobile |


## Edge Cases

- Font load fail → hiển thị fallback 2D text
- Màn hình resize → update camera aspect ratio
- Reduce motion preference → tắt animation

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: N/A (dự án mới)
- **API changes**: N/A
- **Database changes**: N/A
- **Backward compatibility**: N/A
- **Breaking changes**: Không

## Góc Nhìn & Trade-offs


| Quyết định       | User impact          | Developer impact | Security               | Ops/Deploy           |
| ---------------- | -------------------- | ---------------- | ---------------------- | -------------------- |
| Single HTML file | Load nhanh, dễ share | Không cần build  | Minimal attack surface | Static host anywhere |
| Three.js CDN     | Không cần npm        | CDN dependency   | CDN trust              | N/A                  |


## Estimation Tổng


| Phase         | Estimate | Ghi chú               |
| ------------- | -------- | --------------------- |
| Research      | done     |                       |
| Planning      | done     |                       |
| Coding        | 3h       | 4 subtasks            |
| Testing       | 0.5h     | Visual check          |
| Review        | 0.5h     |                       |
| Documentation | 0h       | Self-documenting code |
| **Total**     | **4h**   |                       |


