# Architecture Decision Records

---

## ADR-001: Single HTML file, zero build tools

- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Task yêu cầu "quickly" — cần deliverable nhanh nhất có thể, không có CI/CD setup.
- **Quyết định**: Toàn bộ app (HTML + CSS + JS) trong 1 file `index.html`. Mở thẳng trong browser, không cần `npm install`, không cần server.
- **Hệ quả**: Deploy = copy file. Debug = F12 DevTools. Không có tree-shaking → Three.js full bundle (~600KB gzip ~150KB).

---

## ADR-002: Three.js qua CDN (importmap), không self-host

- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Zero build tool constraint. Cần ES Module imports.
- **Quyết định**: Dùng `importmap` để map `"three"` → `unpkg.com/three@0.160.1`. Pin version cụ thể (`@0.160.1`) để tránh breaking changes.
- **Hệ quả**: Rủi ro CDN dependency (unpkg down = app down). Không có SRI hash do importmap spec limitation. Acceptable cho demo/prototype.
- **Nếu cần production**: Self-host Three.js files hoặc dùng jsDelivr với SRI.

---

## ADR-003: `cfg` object là single source of truth cho mutable state

- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Config panel cần reactive — slider thay đổi → scene update ngay. Cần tách state khỏi UI.
- **Quyết định**: Object `cfg` chứa toàn bộ mutable params (hue, rotX, rotY, orbitSpeed, starOpacity, text). Animation loop đọc trực tiếp từ `cfg`. UI controls ghi vào `cfg` rồi trigger update.
- **Hệ quả**: Animation loop luôn phản ánh state mới nhất. Color changes không cần rebuild geometry. Text changes yêu cầu `buildText()` vì geometry là immutable sau khi tạo.

---

## ADR-004: `wireMesh` không sync với `textMesh` (ghost shadow effect)

- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Wireframe halo tạo "shadow bóng" đẹp — hiệu ứng này sinh ra tự nhiên khi wire đứng yên còn solid text xoay.
- **Quyết định**: `wireMesh` không được update rotation/position trong animation loop. Nó giữ nguyên tại origin (scaled 1.015x) trong khi `textMesh` xoay tự do. Khi text quay ra xa, wireframe ghost lộ ra tạo depth illusion.
- **Hệ quả**: Effect này **phá vỡ** nếu ai đó thêm `wireMesh.rotation.copy(textMesh.rotation)` — đã từng xảy ra và được debug. Comment trong code ghi rõ ý định này.

---

## ADR-005: `started` flag ngăn double animation loop

- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: FontLoader có 2 callbacks (success + error). Nếu cả hai fire (race condition hoặc retry logic), `startAnimate()` có thể được gọi 2 lần → 2 RAF loops chạy song song → double render, double CPU/GPU load, không thể cancel.
- **Quyết định**: `let started = false` guard ở đầu `startAnimate()`. Lần gọi thứ 2 trở đi bị bỏ qua.
- **Hệ quả**: An toàn. Chi phí = 1 boolean check mỗi lần gọi.

## Cập nhật lần cuối: 2026-03-25
