# Plan: claude-dw-presentation

## Ngày tạo: 2026-03-24
## Trạng thái: Approved
## Approved by:

---

## Tóm Tắt Giải Pháp

Tạo một web presentation sử dụng **Reveal.js** (vendored local) với single `index.html`. Toàn bộ slides được viết bằng Markdown inline trong HTML (dùng `data-markdown`), kết hợp với `highlight.js` để syntax highlighting cho code examples.

Project structure đơn giản: mở `index.html` trên browser là present được ngay — không cần server, không cần internet. Nội dung chia 2 phần: Claude từ A-Z (~12 slides) và DW Toolkit introduction (~10 slides).

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | **Reveal.js (vendored)** | Zero install, offline, keyboard nav built-in, code highlighting, professional look | Cần copy vendor files (~2MB) | **Chọn** |
| 2 | Slidev (Vue-based) | Markdown native, hot reload, great dev UX | Cần npm + Node.js, quá heavy cho "simple" | Loại |
| 3 | Pure HTML/CSS | Zero deps, full control | Phải tự code navigation, transitions, code highlighting | Loại |

## Subtasks

### ST-1: Setup project structure + vendor Reveal.js
- **Mô tả**: Tạo cấu trúc thư mục, download Reveal.js dist vào `vendor/`, tạo `index.html` skeleton với Reveal.js init
- **Files**:
  - `index.html` (skeleton)
  - `vendor/reveal.js/dist/reveal.css`
  - `vendor/reveal.js/dist/reveal.js`
  - `vendor/reveal.js/dist/theme/black.css`
  - `vendor/reveal.js/plugin/highlight/highlight.js`
  - `vendor/reveal.js/plugin/highlight/monokai.css`
  - `vendor/reveal.js/plugin/notes/notes.js`
  - `css/custom.css` (empty)
  - `README.md`
- **Acceptance Criteria**:
  - [ ] Mở `index.html` trên browser hiển thị slide đầu tiên
  - [ ] Keyboard navigation (← →, space) hoạt động
  - [ ] Không cần internet để chạy
- **Dependencies**: none
- **Estimate**: 1h

### ST-2: Custom CSS theme
- **Mô tả**: Override Reveal.js black theme với custom styles: font size, colors, code block styling, progress bar
- **Files**:
  - `css/custom.css`
- **Acceptance Criteria**:
  - [ ] Heading font ≥ 40px
  - [ ] Body font ≥ 24px
  - [ ] Progress bar hiển thị ở bottom
  - [ ] Code blocks có background tối, dễ đọc
  - [ ] Slide number hiển thị (góc dưới phải)
- **Dependencies**: ST-1
- **Estimate**: 1.5h

### ST-3: Slides Phần 1 — Claude từ A-Z (~12 slides)
- **Mô tả**: Viết nội dung 12 slides về Claude AI
- **Files**:
  - `index.html` (thêm slide sections)
- **Slide list**:
  1. Title: "Claude AI — Từ A đến Z"
  2. Agenda (2 phần)
  3. Claude là gì? (Anthropic, safety-focused AI)
  4. Model family: Haiku / Sonnet / Opus — so sánh, khi nào dùng gì
  5. Capabilities: Code, Analysis, Writing, Reasoning, Tool use
  6. Claude Code CLI — giới thiệu, cài đặt, demo
  7. Prompt Engineering basics (clear context, examples, chain of thought)
  8. Use cases cho Dev team (debug, review, refactor, docs, test gen)
  9. Limitations & Gotchas (hallucination, context window, knowledge cutoff)
  10. Best practices & tips
  11. Q&A + Resources
- **Acceptance Criteria**:
  - [ ] Mỗi slide có heading rõ, bullet points ngắn (≤5 bullets/slide)
  - [ ] Ít nhất 2 slides có code examples với syntax highlighting
  - [ ] Speaker notes cho mỗi slide
- **Dependencies**: ST-2
- **Estimate**: 4h

### ST-4: Slides Phần 2 — DW Toolkit (~10 slides)
- **Mô tả**: Viết nội dung 10 slides giới thiệu DW toolkit cho Dev team
- **Files**:
  - `index.html` (thêm slide sections)
- **Slide list**:
  1. Section title: "DW Toolkit — Workflow cho Dev team"
  2. Vấn đề cần giải quyết (tại sao cần workflow?)
  3. DW Toolkit là gì? (skill system, config-driven, platform-agnostic)
  4. Kiến trúc: `.dw/` structure, `.claude/` skills, config file
  5. Workflow depths: quick / standard / thorough
  6. Key skills cheat sheet (bảng tóm tắt)
  7. `/dw-flow` — orchestrator, demo nhanh
  8. Setup cho project mới (`/dw-config-init`)
  9. Tips & best practices
  10. Q&A + Getting started
- **Acceptance Criteria**:
  - [ ] Slide "Key skills cheat sheet" có bảng đầy đủ
  - [ ] Code examples cho commands (dùng bash syntax highlighting)
  - [ ] Speaker notes cho mỗi slide
- **Dependencies**: ST-2
- **Estimate**: 3.5h

### ST-5: Polish & QA
- **Mô tả**: Kiểm tra toàn bộ presentation, fix rendering issues, test cross-browser
- **Files**:
  - `index.html`, `css/custom.css`
- **Acceptance Criteria**:
  - [ ] Navigate qua toàn bộ slides không có lỗi
  - [ ] Syntax highlighting hoạt động đúng
  - [ ] Fullscreen (F key) hoạt động
  - [ ] Speaker notes (S key) hoạt động
  - [ ] Test trên Chrome + Firefox
  - [ ] README.md có hướng dẫn mở presentation
- **Dependencies**: ST-3, ST-4
- **Estimate**: 1.5h

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | Reveal.js vendor copy hoạt động từ local file:// | Thấp | Cao | Test ngay ST-1 |
| 2 | Rủi ro | Content slides quá dài, text overflow | TB | TB | Giới hạn 5 bullets/slide, dùng fragments |
| 3 | Rủi ro | Markdown parsing trong Reveal.js có quirks | Thấp | Thấp | Fallback sang HTML markup nếu cần |

## Edge Cases

- [ ] Browser block local file:// loading → ghi hướng dẫn trong README (`python -m http.server`)
- [ ] Slide content quá dài → dùng `<small>` tag hoặc tách thành vertical slides
- [ ] Code examples có special chars (< > &) trong Markdown → escape hoặc dùng HTML `<code>`

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: N/A (project mới, standalone)
- **API changes**: Không
- **Database changes**: Không
- **Backward compatibility**: N/A
- **Breaking changes**: Không

## Góc Nhìn & Trade-offs

| Quyết định | User (TechLead) | Developer | Ops/Deploy |
|-----------|-----------------|-----------|------------|
| Vendor Reveal.js | Chạy offline ✓ | +2MB project size | Chỉ cần share folder |
| Single index.html | Dễ mở, dễ share | File dài hơn | 1 file copy là xong |
| Markdown-based slides | Dễ edit content | Cần escape special chars | N/A |

## Estimation Tổng

| Phase | Estimate | Ghi chú |
|-------|----------|---------|
| Research | 1h | done |
| Planning | 1h | done |
| ST-1: Setup + vendor | 1h | |
| ST-2: CSS theme | 1.5h | |
| ST-3: Claude slides | 4h | 12 slides content |
| ST-4: DW slides | 3.5h | 10 slides content |
| ST-5: Polish + QA | 1.5h | |
| Review | 1h | |
| Buffer (20%) | 2.5h | |
| **Total** | **~17h** | Confidence: High |
