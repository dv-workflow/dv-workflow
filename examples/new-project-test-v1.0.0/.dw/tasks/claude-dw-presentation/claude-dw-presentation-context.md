# Context: claude-dw-presentation

## Ngày khảo sát: 2026-03-24
## Người thực hiện: agent

---

## Yêu Cầu Gốc

> Tạo một project đơn giản có một số trang/slide để TechLead trình bày về Claude (từ A-Z) và giới thiệu DW toolkit cho Dev team.

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Cần thay đổi? | Ghi chú |
|---|------|---------|----------------|---------|
| 1 | index.html | Entry point + all slides | Tạo mới | Dùng Reveal.js CDN |
| 2 | css/custom.css | Custom theme overrides | Tạo mới | |
| 3 | js/custom.js | Custom plugins/interactions | Tạo mới nếu cần | Optional |

### Kiến Trúc Dự Kiến (Reveal.js CDN)

```
index.html (single file presentation)
    ├── <head> → Reveal.js CDN links (CSS + highlight.js)
    ├── <div class="reveal">
    │       └── <div class="slides">
    │               ├── <section> Slide 1: Title
    │               ├── <section> Slide 2: Agenda
    │               ├── <section> ... Claude A-Z slides (~12)
    │               └── <section> ... DW Toolkit slides (~10)
    └── <script> → Reveal.initialize({...})
css/
    └── custom.css   → theme overrides, fonts, custom colors
```

### Data Flow

- **Input**: Static HTML content
- **Processing**: Reveal.js handles navigation, transitions, code highlighting
- **Output**: Presentation rendered in browser
- **Storage**: Static files only — no server needed, open index.html directly

## Dependencies

### Upstream (task phụ thuộc vào)
- [ ] Nội dung về Claude — cần research/compile
- [ ] Nội dung về DW toolkit — có sẵn trong docs

### Downstream (bị ảnh hưởng bởi task)
- [ ] N/A — đây là standalone project

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Nguồn |
|---------|--------|--------------------|
| Reveal.js sections | Mỗi `<section>` = 1 slide | Reveal.js docs |
| Nested sections | `<section><section>` = vertical slides (sub-slides) | Reveal.js |
| data-markdown | Viết slide bằng Markdown thay vì HTML | Reveal.js |

## DW Content Sources

| Source | Nội dung có thể dùng | Path |
|--------|---------------------|------|
| CLAUDE.md | Skills table, workflow routing, commit format | `/CLAUDE.md` |
| WORKFLOW.md | 6 phases, routing depth, methodology | `.dw/core/WORKFLOW.md` |
| ROLES.md | Role overview table, responsibilities | `.dw/core/ROLES.md` |
| QUALITY.md | Quality layers, test strategy | `.dw/core/QUALITY.md` |
| Skills SKILL.md | Từng skill description và usage | `.claude/skills/dw-*/SKILL.md` |

## Test Coverage Hiện Tại

- [ ] Có tests cho khu vực liên quan? Không (static presentation)
- Không cần unit tests cho static HTML slides

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | Reveal.js CDN — không cần internet khi present | Có | Cần bundle offline |
| 2 | TechLead present từ local browser | Không | |
| 3 | Tiếng Việt cho DW section, có thể mix EN cho Claude section | Không | |

## Hạn Chế Đã Biết
- Reveal.js CDN requires internet connection — nếu present ở nơi không có mạng cần bundle

## Chưa Rõ / Cần Làm Rõ
- [ ] Cần export PDF không?
- [ ] Online hay offline presentation?

## Framework Decision: Reveal.js (CDN)
**Lý do chọn**: Zero install, keyboard navigation built-in, syntax highlighting, single HTML file, PDF export plugin available.
**Trade-off**: Cần internet (CDN) → có thể bundle Reveal.js local nếu cần offline.
