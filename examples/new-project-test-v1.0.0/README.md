# Claude & DW Toolkit — TechLead Presentation

Slides trình bày về Claude AI (từ A-Z) và DW Workflow Toolkit cho Dev team.

## Cách mở

### Option 1: Trực tiếp (cần internet cho CDN)
```
Mở file index.html bằng Chrome/Firefox/Edge
```
 
### Option 2: Local server (khuyên dùng — offline support)
```bash
# Python 3
python -m http.server 8000
# Sau đó mở http://localhost:8000
```

```bash
# Node.js
npx serve .
# Sau đó mở http://localhost:3000
```

### Option 3: Offline hoàn toàn (vendor Reveal.js)
```bash
# 1. Cài Node.js nếu chưa có
# 2. Download Reveal.js
npm install reveal.js

# 3. Copy dist files
mkdir -p vendor/reveal.js
cp -r node_modules/reveal.js/dist vendor/reveal.js/dist
cp -r node_modules/reveal.js/plugin vendor/reveal.js/plugin

# 4. Đổi CDN links trong index.html thành local paths (xem comment trong index.html)
# 5. Mở index.html trực tiếp
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` / `Space` | Slide tiếp theo |
| `←` | Slide trước |
| `F` | Fullscreen |
| `S` | Speaker notes |
| `O` | Overview mode |
| `ESC` | Thoát fullscreen/overview |

## Nội dung

- **Phần 1**: Claude AI từ A-Z (~12 slides)
- **Phần 2**: DW Workflow Toolkit (~10 slides)

---

*Tạo bằng [Reveal.js](https://revealjs.com/)*
