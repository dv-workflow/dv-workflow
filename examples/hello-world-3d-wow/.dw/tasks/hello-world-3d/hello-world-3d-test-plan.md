# Test Plan: hello-world-3d

## Ngày: 2026-03-25 | QC: agent | Status: Draft

---

## Scope

**In scope**:
- Render 3D scene khởi động đúng (Three.js, canvas, lights, particles)
- TextGeometry "Hello World" hiển thị và rotate
- Ghost shadow (wireMesh static, textMesh dynamic)
- Random seed: hue, rotX, rotY, camDist, camAngle khác nhau mỗi load
- Config panel: toggle, tất cả controls, Randomize, Reset
- Font load fallback khi CDN không khả dụng
- Resize handler
- `prefers-reduced-motion` accessibility
- Memory: không có double animation loop

**Out of scope**:
- Unit test tự động (không có test runner — static HTML)
- Backend / API / database
- Cross-browser IE/legacy support
- SEO / server-side rendering

**Test environment**: Browser (Chrome latest, Firefox latest, Safari latest) — mở `index.html` trực tiếp hoặc qua `npx serve .`

---

## Test Strategy

- [x] Manual functional testing (QC) — primary
- [x] Visual regression (manual screenshot compare)
- [x] Accessibility check (`prefers-reduced-motion`, keyboard)
- [x] Performance check (DevTools FPS, Memory tab)
- [ ] Automated UI testing — N/A cho static demo
- [ ] Security testing — minimal (no input to server, no auth)

---

## Test Cases

### [GROUP 1] Khởi động & Render cơ bản

---

### TC-001: Page load — canvas fullscreen hiển thị
- **Preconditions**: Có kết nối internet (CDN), mở `index.html` trong Chrome
- **Steps**:
  1. Mở `index.html` trong browser
  2. Quan sát loader spinner xuất hiện
  3. Chờ ≤ 5 giây
- **Expected Result**: Spinner biến mất, canvas 3D chiếm toàn màn hình với dark background `#05050d`
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-002: 3D text "Hello World" render đúng
- **Preconditions**: TC-001 Pass
- **Steps**:
  1. Load xong
  2. Quan sát center màn hình
- **Expected Result**: Text "Hello World" 3D (2 dòng) xuất hiện, có depth/bevel effect, màu metallic neon
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-003: Text tự rotate (animation)
- **Preconditions**: TC-002 Pass
- **Steps**:
  1. Quan sát text trong 5 giây
- **Expected Result**: Text xoay liên tục theo trục X và Y, có hiệu ứng bob nhẹ lên xuống
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-004: Ghost shadow (wireMesh static)
- **Preconditions**: TC-003 Pass
- **Steps**:
  1. Quan sát text trong khi rotate
  2. Chú ý vùng xung quanh text khi nó xoay ra xa
- **Expected Result**: Wireframe ghost layer xuất hiện/ẩn khi text xoay, tạo depth illusion. Ghost KHÔNG di chuyển cùng text
- **Priority**: P1 Critical
- **Status**: Not Run
- **Ghi chú**: Bug đã từng xảy ra (ADR-004) — test case này là regression guard

---

### TC-005: Particle field (star background)
- **Preconditions**: TC-001 Pass
- **Steps**:
  1. Quan sát background
- **Expected Result**: Các hạt particles phân bố xung quanh scene, không cluttered, opacity ~0.55
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-006: Camera orbit
- **Preconditions**: TC-002 Pass
- **Steps**:
  1. Quan sát vị trí camera trong 10 giây
- **Expected Result**: Camera từ từ bay vòng quanh text theo đường orbit, góc nhìn thay đổi dần
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-007: Light pulse
- **Preconditions**: TC-002 Pass
- **Steps**:
  1. Quan sát độ sáng của scene trong 5 giây
- **Expected Result**: Ánh sáng fill light nhấp nháy nhẹ (pulsing) tạo hiệu ứng sống động
- **Priority**: P3 Medium
- **Status**: Not Run

---

### [GROUP 2] Random seed

---

### TC-008: Random hue mỗi load
- **Preconditions**: TC-002 Pass
- **Steps**:
  1. Note màu sắc của text và lights
  2. Reload trang (Ctrl+R)
  3. Note lại màu sắc
- **Expected Result**: Màu hue khác nhau giữa 2 lần load (xác suất màu giống nhau ~1/360)
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-009: Random rotation speed mỗi load
- **Preconditions**: TC-003 Pass
- **Steps**:
  1. Quan sát tốc độ rotate
  2. Reload trang
  3. Quan sát lại tốc độ
- **Expected Result**: Tốc độ và/hoặc hướng xoay khác nhau giữa 2 lần load
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-010: Random camera angle mỗi load
- **Preconditions**: TC-006 Pass
- **Steps**:
  1. Note góc camera lúc đầu
  2. Reload trang
  3. Note lại góc camera
- **Expected Result**: Góc camera ban đầu khác nhau (xuất phát từ điểm khác trên orbit)
- **Priority**: P3 Medium
- **Status**: Not Run

---

### [GROUP 3] Config Panel

---

### TC-011: Toggle panel bằng button
- **Preconditions**: TC-001 Pass
- **Steps**:
  1. Click icon button góc trên phải
  2. Quan sát panel
  3. Click lại
- **Expected Result**: Panel hiện ra lần 1 (fade in, scale). Click lần 2 → panel ẩn. Toggle hoạt động smooth
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-012: Toggle panel bằng phím C
- **Preconditions**: TC-011 Pass
- **Steps**:
  1. Focus vào browser window (không focus vào text input)
  2. Nhấn phím `C`
  3. Nhấn `C` lần nữa
- **Expected Result**: Panel toggle mở/đóng giống TC-011
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-013: Phím C không toggle khi đang focus text input
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Click vào text input trong panel
  2. Nhấn phím `C`
- **Expected Result**: Ký tự "C" được nhập vào input, panel KHÔNG đóng
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-014: Hue slider — đổi màu real-time
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Kéo hue slider từ trái sang phải chậm
  2. Quan sát: text, lights, particles, swatch preview, `°` indicator
- **Expected Result**: Toàn bộ màu sắc scene thay đổi smooth theo slider. Swatch chính và accent cập nhật. Giá trị `°` hiển thị đúng
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-015: Spin X slider — đổi tốc độ + hướng
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Kéo Spin X sang giá trị âm (< 0)
  2. Quan sát hướng xoay trục X
  3. Kéo về giá trị dương
- **Expected Result**: Giá trị âm = xoay ngược chiều trục X. Dương = xuôi chiều. 0 = không xoay
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-016: Spin Y slider
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Kéo Spin Y về 0
  2. Kéo về max 0.5
- **Expected Result**: Tốc độ xoay trục Y thay đổi tương ứng
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-017: Orbit slider — đổi tốc độ camera
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Kéo Orbit về 0 → camera ngừng orbit
  2. Kéo về max 0.15 → camera orbit nhanh
- **Expected Result**: Tốc độ orbit camera phản ánh đúng giá trị slider
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-018: Stars slider — opacity particles
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Kéo Stars về 0 → particles biến mất
  2. Kéo về 1 → particles hiện rõ
- **Expected Result**: Particle opacity thay đổi smooth real-time
- **Priority**: P3 Medium
- **Status**: Not Run

---

### TC-019: Text input — apply text mới bằng button
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Xóa text input, nhập "Claude 3D"
  2. Click nút "Apply"
- **Expected Result**: 3D text rebuild, hiển thị "Claude 3D" trong scene. Không có crash hay flicker kéo dài
- **Priority**: P1 Critical
- **Status**: Not Run

---

### TC-020: Text input — apply bằng Enter
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Click vào text input
  2. Thay đổi nội dung
  3. Nhấn Enter
- **Expected Result**: Text rebuild như TC-019
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-021: Text input — empty string → fallback
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Xóa hết text trong input
  2. Click Apply
- **Expected Result**: Hiển thị fallback "Hello World" (không crash, không render text rỗng)
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-022: Text input — text dài / ký tự đặc biệt
- **Preconditions**: Panel đang mở
- **Steps**:
  1. Nhập text dài 40 ký tự (maxlength)
  2. Apply
  3. Thử nhập ký tự đặc biệt: `!@#$%^&*()`
  4. Apply
- **Expected Result**: Text 40 ký tự render (có thể tràn ra ngoài view — chấp nhận được). Ký tự đặc biệt render hoặc hiển thị fallback nếu font không hỗ trợ. Không crash
- **Priority**: P3 Medium
- **Status**: Not Run

---

### TC-023: Randomize button
- **Preconditions**: Panel đang mở, đang ở giá trị mặc định
- **Steps**:
  1. Note tất cả giá trị slider hiện tại
  2. Click "⟳ Randomize"
  3. Quan sát sliders và scene
- **Expected Result**: Tất cả sliders nhảy sang giá trị mới ngẫu nhiên. Scene update toàn bộ: màu, tốc độ, stars. Swatch cập nhật
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-024: Reset button
- **Preconditions**: Panel đang mở, đã thay đổi nhiều giá trị
- **Steps**:
  1. Thay đổi hue, spin, orbit sang giá trị bất kỳ
  2. Click "Reset"
- **Expected Result**: Tất cả sliders về giá trị lúc page load (DEFAULTS snapshot). Scene revert về initial state
- **Priority**: P2 High
- **Status**: Not Run

---

### [GROUP 4] Edge Cases & Error Handling

---

### TC-025: Font load failure — fallback UI
- **Preconditions**: Có cách block network cho unpkg.com (DevTools → Network → Block request URL)
- **Steps**:
  1. Mở DevTools → Network → Block `unpkg.com/three@0.160.1/examples/fonts/...`
  2. Reload trang
  3. Quan sát sau khi loader ẩn
- **Expected Result**: Loader ẩn. Label text hiển thị "hello world · 3d" với màu neon. Không có JS error crash. Scene vẫn render (particles, lights, camera)
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-026: Window resize — canvas responsive
- **Preconditions**: TC-002 Pass
- **Steps**:
  1. Kéo cửa sổ browser nhỏ lại (portrait-like)
  2. Kéo to ra (landscape wide)
  3. F11 fullscreen → thoát fullscreen
- **Expected Result**: Canvas resize theo window. Không có stretch/distortion. Camera aspect ratio cập nhật đúng (không méo)
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-027: `prefers-reduced-motion` — animation tắt
- **Preconditions**: Bật `prefers-reduced-motion` (Chrome DevTools → Rendering → Emulate CSS media → prefers-reduced-motion: reduce)
- **Steps**:
  1. Bật emulation
  2. Load trang
- **Expected Result**: 3D text KHÔNG rotate. Camera KHÔNG orbit. Scene render static (1 frame). Particles hiển thị. Spinner cũng không spin (CSS)
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-028: Không có double animation loop
- **Preconditions**: DevTools Performance tab sẵn sàng
- **Steps**:
  1. Mở DevTools → Performance → Record
  2. Load trang
  3. Chờ 5 giây
  4. Stop recording
  5. Kiểm tra `requestAnimationFrame` calls
- **Expected Result**: Chỉ có 1 RAF loop chạy (~60 calls/giây). Không có dấu hiệu 2x CPU usage bất thường
- **Priority**: P1 Critical
- **Status**: Not Run
- **Ghi chú**: Guard bug — xem ADR-005

---

### TC-029: Memory không tăng khi rebuild text nhiều lần
- **Preconditions**: DevTools Memory tab sẵn sàng
- **Steps**:
  1. Mở DevTools → Memory → Take heap snapshot (baseline)
  2. Đổi text 10 lần qua config panel
  3. Take heap snapshot lần 2
  4. So sánh
- **Expected Result**: Heap size không tăng đáng kể (< 5MB difference). Không có geometry/material leak
- **Priority**: P2 High
- **Status**: Not Run

---

### [GROUP 5] Performance & Visual

---

### TC-030: 60fps trên desktop
- **Preconditions**: DevTools Performance hoặc Stats extension
- **Steps**:
  1. Load trang
  2. Quan sát FPS trong DevTools → Performance Monitor
- **Expected Result**: FPS ≥ 55 trên hardware desktop trung bình
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-031: Mobile — render không crash
- **Preconditions**: DevTools Device Emulation (iPhone 12, Galaxy S21)
- **Steps**:
  1. Bật device emulation
  2. Load trang
  3. Quan sát 10 giây
- **Expected Result**: Trang load được, scene render (có thể FPS thấp hơn). Không crash tab. Config panel usable
- **Priority**: P2 High
- **Status**: Not Run

---

### TC-032: Config panel layout — màn hình nhỏ (≤400px)
- **Preconditions**: Device emulation width ≤ 400px
- **Steps**:
  1. Set viewport 375px
  2. Mở config panel
- **Expected Result**: Panel không tràn ra ngoài viewport (`width: calc(100vw - 5rem)` responsive CSS)
- **Priority**: P3 Medium
- **Status**: Not Run

---

## Regression Checklist

Các tính năng có thể bị ảnh hưởng sau khi debug/revise:

- [ ] **Ghost shadow effect** — `wireMesh` vẫn KHÔNG sync rotation (TC-004) → ADR-004 còn hiệu lực
- [ ] **Text rebuild** — dispose cũ trước khi tạo mới, không leak geometry (TC-029)
- [ ] **Double loop guard** — `started` flag hoạt động (TC-028)
- [ ] **Color update** — `applyColorToMaterials()` cập nhật đủ 6 targets khi hue thay đổi (TC-014)
- [ ] **Reduced motion** — animation thực sự tắt, không chỉ là dead code (TC-027)

---

## Performance Criteria

| Metric | Target | Actual |
|--------|--------|--------|
| Time to render (desktop) | < 3s (CDN load) | |
| FPS desktop | ≥ 55 fps | |
| FPS mobile (emulated) | ≥ 30 fps | |
| Heap after 10 text rebuilds | < baseline + 5MB | |
| JS errors on load | 0 | |

---

## Bug Report Template

```markdown
**Bug**: [Tiêu đề ngắn gọn]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1.
2.
**Expected**: [Kết quả mong đợi]
**Actual**: [Kết quả thực tế]
**Environment**: [OS, Browser, Version, Device]
**Screenshot / Recording**: [đính kèm]
**Related TC**: [TC-XXX]
```

---

## Sign-off Criteria

- [ ] Tất cả P1 test cases PASS (TC-001, 002, 003, 004, 011, 014, 019, 028)
- [ ] Không có open Critical/High bugs
- [ ] Regression checklist clear (đặc biệt TC-004 ghost shadow)
- [ ] Performance: FPS ≥ 55 desktop, 0 JS errors
- [ ] TC-027 (reduced-motion) PASS — accessibility requirement

---

*Test plan tạo bởi dw-workflow-kit | hello-world-3d | 2026-03-25*
