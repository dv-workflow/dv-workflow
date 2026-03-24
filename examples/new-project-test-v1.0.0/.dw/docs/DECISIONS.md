# Architecture Decision Records

## ADR-001: Dùng Reveal.js CDN thay vì Slidev hoặc thuần HTML
- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Cần chọn framework cho presentation. Yêu cầu: zero install, keyboard navigation, syntax highlighting, đơn giản.
- **Quyết định**: Reveal.js 5.1.0 qua CDN (jsdelivr.net)
- **Hệ quả**:
  - ✅ Mở trực tiếp không cần npm/build step
  - ✅ Keyboard nav, fullscreen, speaker notes built-in
  - ✅ highlight.js syntax highlighting bundled
  - ⚠️ Cần internet cho CDN — xem README.md để vendor local

## ADR-002: Single index.html thay vì multi-file slides
- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Có thể tách slides thành nhiều files với `data-external`, hoặc giữ 1 file.
- **Quyết định**: Single `index.html` với inline Markdown content
- **Hệ quả**:
  - ✅ Dễ share (1 file + css/)
  - ✅ Không cần http server để load external files
  - ⚠️ File dài khi slides nhiều (hiện tại ~900 lines — acceptable)

## ADR-003: Tiếng Việt là ngôn ngữ chính
- **Ngày**: 2026-03-25
- **Trạng thái**: Accepted
- **Bối cảnh**: Target audience là Dev team nội bộ Việt Nam.
- **Quyết định**: Nội dung chính bằng tiếng Việt, technical terms giữ nguyên tiếng Anh.
- **Hệ quả**: Slides accessible hơn cho toàn team, không chỉ TechLead.
