---
name: dw-requirements
description: "BA skill: Thu thập, phân tích và viết requirements document + user stories. Dùng ở đầu feature trước khi dev bắt đầu."
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Glob
---

# Thu Thập & Viết Requirements

Feature: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → `paths.tasks`, `team.roles`, `workflow.default_depth`.
Skill này dành cho depth: `standard` hoặc `thorough`.

## Quy Trình

### 1. Thu thập thông tin

Hỏi (hoặc đọc từ conversation context):
- **Business goal**: Mục tiêu kinh doanh là gì?
- **User problems**: Người dùng đang gặp vấn đề gì?
- **Stakeholders**: Ai bị ảnh hưởng? (end user, admin, ops)
- **Scope**: In-scope là gì? Out-of-scope là gì?
- **Constraints**: Deadline? Tech constraints? Budget?
- **Success criteria**: Làm sao biết feature thành công?

### 2. Phân tích & cấu trúc

Tổ chức yêu cầu thành:
- **Functional requirements**: Hệ thống PHẢI làm gì
- **Non-functional requirements**: Performance, security, scalability
- **User stories**: As [who], I want [what], so that [why]
- **Acceptance criteria**: Điều kiện pass/fail

### 3. Tạo Requirements Doc

Ghi ra `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-requirements.md`:

```markdown
# Requirements: [Feature Name]

## Ngày: [date] | Author: BA | Status: Draft

## Business Context
**Goal**: [Mục tiêu kinh doanh]
**Problem**: [Vấn đề cần giải quyết]
**Success Metrics**: [Đo lường thành công bằng gì]

## Stakeholders
| Role | Nhu cầu | Priority |
|------|---------|---------|
| End User | | Must-have |
| Admin | | |

## User Stories

### Epic: [Tên epic]

**US-001**: Tiêu đề ngắn gọn
- **As**: [role]
- **I want**: [action/feature]
- **So that**: [business value]
- **Acceptance Criteria**:
  - [ ] Given [context], when [action], then [result]
  - [ ] Given [context], when [edge case], then [expected behavior]
- **Priority**: Must-have / Should-have / Nice-to-have
- **Estimate**: [rough size]

## Functional Requirements
| # | Requirement | Priority | Notes |
|---|------------|---------|-------|

## Non-Functional Requirements
| # | Requirement | Metric |
|---|------------|--------|
| NFR-1 | Performance: page load < 2s | p95 |
| NFR-2 | Availability: 99.9% uptime | |

## Out of Scope
- [Điều này KHÔNG bao gồm]

## Open Questions
- [ ] [Câu hỏi cần BA/PM làm rõ]

## Dependencies
- [Feature/system khác cần có trước]
```

## Sau Khi Tạo

- Thông báo dev: "Requirements doc sẵn sàng tại [path]"
- Gợi ý: "TL có thể chạy `/dw-arch-review $ARGUMENTS` để review technical feasibility"
- Gợi ý: "Dev có thể chạy `/dw-task-init $ARGUMENTS` để bắt đầu implementation"
