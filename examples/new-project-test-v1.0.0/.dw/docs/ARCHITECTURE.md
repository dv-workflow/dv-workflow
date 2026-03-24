# Kiến Trúc Hệ Thống

## Tổng Quan

Project `new-project-test-v1.0.0` là một **static web presentation** sử dụng Reveal.js, dùng để TechLead trình bày về Claude AI và DW Workflow Toolkit cho Dev team.

Zero backend, zero server — chỉ cần mở `index.html` trên browser.

## Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Presentation framework | Reveal.js 5.1.0 (CDN) | Có thể vendor local |
| Syntax highlighting | highlight.js (bundled với Reveal.js) | Monokai theme |
| Speaker notes | Reveal.js Notes plugin | Mở bằng phím S |
| Styling | Custom CSS override | `css/custom.css` |
| Content | Inline HTML + Markdown | Trong `index.html` |

## Cấu Trúc Thư Mục

```
new-project-test-v1.0.0/
├── index.html           # Entry point — toàn bộ slides
├── css/
│   └── custom.css       # Theme overrides cho Reveal.js black theme
├── README.md            # Hướng dẫn mở presentation + offline setup
├── CLAUDE.md            # Project instructions cho Claude Code
├── .claude/             # Claude Code skills, rules, templates
└── .dw/                 # DW Toolkit config, task docs, core methodology
    ├── config/
    │   └── dw.config.yml
    ├── tasks/
    │   └── claude-dw-presentation/
    └── docs/            # Living docs (this directory)
```

## Modules / Slides

| Module | Slides | Mô tả |
|--------|--------|-------|
| Claude A-Z | 1–12 | Title, Agenda, Claude intro, Models, Capabilities, Agentic Mode, Skills, CLI, Prompt Engineering, Use Cases, Limitations, Best Practices, Summary |
| DW Toolkit | 13–22 | Section title, Problems, What is DW, Architecture, Workflow Depths, Key Skills, /dw-flow, Setup, Tips, Weaknesses |
| Closing | 23–26 | Roadmap, Q&A + Resources, Thank You |

## Data Flow

```
User opens index.html
       ↓
Browser loads Reveal.js (CDN or vendor/)
       ↓
Reveal.initialize() → parses <section> elements as slides
       ↓
highlight.js → syntax highlighting for <code> blocks
       ↓
Keyboard events (← →, Space, F, S, O) → Reveal API handles navigation
```

## Deployment

Không cần deployment — share thư mục hoặc open `index.html` trực tiếp.
Offline: xem hướng dẫn trong `README.md`.

## Cập nhật lần cuối: 2026-03-25
