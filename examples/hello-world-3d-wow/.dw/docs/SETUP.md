# Setup & Chạy Dự Án

## Yêu Cầu

- Browser hiện đại hỗ trợ ES Modules + `importmap`: Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+
- Kết nối internet (lần đầu load Three.js từ CDN) — hoặc xem phần Offline bên dưới

**Không cần**: Node.js, npm, build tool, server.

## Chạy Nhanh

```bash
# Mở thẳng file trong browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Hoặc drag & drop `index.html` vào browser tab.

## Chạy Qua Local Server (khuyến nghị cho dev)

Một số browser giới hạn ES Module imports qua `file://`. Nếu gặp lỗi CORS:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx, không cần install)
npx serve .

# VS Code: Live Server extension → Right click index.html → Open with Live Server
```

Truy cập: `http://localhost:8080`

## Offline / Self-host Three.js

Nếu không có internet hoặc muốn tránh CDN dependency:

1. Tải Three.js: `https://unpkg.com/three@0.160.1/build/three.module.js`
2. Tải addons:
   - `https://unpkg.com/three@0.160.1/examples/jsm/loaders/FontLoader.js`
   - `https://unpkg.com/three@0.160.1/examples/jsm/geometries/TextGeometry.js`
3. Tải font: `https://unpkg.com/three@0.160.1/examples/fonts/helvetiker_bold.typeface.json`
4. Cập nhật `importmap` và font loader URL trong `index.html` trỏ tới file local

## Cấu Trúc File

```
index.html     ← Toàn bộ app trong 1 file
```

## Config Panel

- Nhấn `C` hoặc click icon góc trên phải để mở/đóng
- **Text**: Nhập text mới → Enter hoặc Apply (hỗ trợ `\n` cho xuống dòng)
- **Color**: Hue slider 0–360° (cả scene đổi màu real-time)
- **Spin X / Y**: Tốc độ + hướng quay (rad/s)
- **Orbit**: Tốc độ camera bay quanh text
- **Stars**: Opacity của particle background
- **Randomize**: Random toàn bộ params
- **Reset**: Về giá trị ban đầu

## Accessibility

- `prefers-reduced-motion`: Animation tắt tự động, scene vẫn render static

## Cập nhật lần cuối: 2026-03-25
