# Requirements: claude-dw-presentation

## Ngày: 2026-03-24 | Author: BA | Status: Draft

## Business Context

**Goal**: TechLead có công cụ để trình bày về Claude AI và DW toolkit cho Dev team một cách bài bản, dễ hiểu.
**Problem**: Dev team chưa hiểu đầy đủ về Claude và DW workflow toolkit, cần một buổi giới thiệu có cấu trúc.
**Success Metrics**:

- TechLead có thể present slides trong 30-60 phút
- Dev team hiểu Claude là gì và dùng được DW toolkit cơ bản sau buổi trình bày
- Slides đẹp, dễ nhìn, chạy trên browser không cần setup

## Stakeholders


| Role                 | Nhu cầu                                       | Priority     |
| -------------------- | --------------------------------------------- | ------------ |
| TechLead (Presenter) | Slides rõ ràng, dễ navigate, có speaker notes | Must-have    |
| Dev Team (Audience)  | Nội dung súc tích, ví dụ thực tế, dễ tiêu hóa | Must-have    |
| PM                   | Có thể reuse cho onboarding mới               | Nice-to-have |


## User Stories

### Epic: Presentation Slides Project

**US-001**: Xem slides trên browser

- **As**: TechLead
- **I want**: Mở file index.html trên browser và navigate qua các slides
- **So that**: Có thể present mà không cần install thêm gì
- **Acceptance Criteria**:
  - Given presenter mở index.html, when browser load, then slides hiển thị đúng
  - Given đang ở slide N, when nhấn → hoặc space, then chuyển sang slide N+1
  - Given đang ở slide N, when nhấn ←, then quay lại slide N-1
- **Priority**: Must-have
- **Estimate**: S

**US-002**: Nội dung phần Claude từ A-Z

- **As**: Dev team member
- **I want**: Hiểu Claude là gì, có thể làm gì, hạn chế gì
- **So that**: Có nền tảng để làm việc hiệu quả với Claude
- **Acceptance Criteria**:
  - Slides cover: Claude là gì, các model (Haiku/Sonnet/Opus), capabilities, limitations
  - Slides cover: Cách dùng Claude Code CLI, prompt engineering basics
  - Slides cover: Use cases thực tế trong dev work
  - Mỗi slide có heading rõ, bullet points ngắn gọn
- **Priority**: Must-have
- **Estimate**: M

**US-003**: Nội dung giới thiệu DW toolkit

- **As**: Dev team member
- **I want**: Hiểu DW toolkit là gì và cách dùng cơ bản
- **So that**: Có thể bắt đầu dùng workflow ngay sau buổi present
- **Acceptance Criteria**:
  - Slides cover: DW toolkit là gì, mục tiêu, lợi ích
  - Slides cover: Các skills chính (/dw-flow, /dw-plan, /dw-execute, ...)
  - Slides cover: Demo workflow cơ bản (quick tour)
  - Slides cover: Cách setup cho project mới
- **Priority**: Must-have
- **Estimate**: M

**US-004**: Slide design đẹp

- **As**: TechLead
- **I want**: Slides có design chuyên nghiệp, dễ nhìn
- **So that**: Buổi present trông professional
- **Acceptance Criteria**:
  - Dark theme hoặc clean light theme
  - Font size đủ lớn (≥24px body, ≥36px headings)
  - Syntax highlighting cho code examples
  - Progress indicator (slide N/total)
- **Priority**: Must-have
- **Estimate**: S

**US-005**: Speaker notes (Nice-to-have)

- **As**: TechLead
- **I want**: Có ghi chú riêng cho từng slide
- **So that**: Nhớ điểm cần nhấn mạnh khi present
- **Priority**: Nice-to-have
- **Estimate**: XS

## Functional Requirements


| #    | Requirement                                     | Priority     | Notes               |
| ---- | ----------------------------------------------- | ------------ | ------------------- |
| FR-1 | Navigation: keyboard (← →, space)               | Must-have    |                     |
| FR-2 | Slide counter / progress bar                    | Must-have    |                     |
| FR-3 | Responsive (1920x1080 chính, 1280x720 fallback) | Must-have    |                     |
| FR-4 | Code blocks với syntax highlighting             | Must-have    | Cho phần DW toolkit |
| FR-5 | Table of contents / agenda slide                | Should-have  |                     |
| FR-6 | Fullscreen mode                                 | Should-have  |                     |
| FR-7 | Print / PDF export                              | Nice-to-have |                     |
| FR-8 | Speaker notes                                   | Nice-to-have |                     |


## Non-Functional Requirements


| #     | Requirement               | Metric                                 |
| ----- | ------------------------- | -------------------------------------- |
| NFR-1 | Load time                 | < 2s trên localhost                    |
| NFR-2 | Zero dependencies install | Mở trực tiếp hoặc npm install đơn giản |
| NFR-3 | Cross-browser             | Chrome, Firefox, Edge                  |


## Slide Structure (Draft)

### Phần 1: Claude từ A-Z (~10-12 slides)

1. Title / Welcome
2. Agenda
3. Claude là gì? (Anthropic, family)
4. Các model: Haiku / Sonnet / Opus — khi nào dùng gì
5. Capabilities: Code, Analysis, Writing, Reasoning
6. Claude Code CLI — giới thiệu
7. Prompt Engineering basics
8. Use cases cho Dev team
9. Limitations & Gotchas
10. Best practices

### Phần 2: DW Toolkit (~8-10 slides)

1. DW Toolkit là gì?
2. Vấn đề toolkit giải quyết
3. Kiến trúc: Skills, Config, Tasks
4. Workflow overview (phases)
5. Demo: /dw-flow quick tour
6. Key skills (cheat sheet)
7. Setup cho project mới
8. Q&A / Resources

## Out of Scope

- Backend server (chỉ static files)
- Authentication
- Analytics tracking
- Multi-language (chỉ tiếng Việt)
- Mobile responsive (optimize cho desktop present)

## Open Questions

- Dùng framework nào? Reveal.js vs Slidev vs thuần HTML — cần quyết định
- Có cần export PDF không?
- Có demo live hay chỉ screenshots?

## Dependencies

- Không có dependencies bên ngoài (standalone project)

