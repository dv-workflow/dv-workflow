# Test Plan: claude-dw-presentation

## Ngày: 2026-03-24 | QC: agent | Status: Draft

## Scope
**In scope**: Navigation, rendering, content display, syntax highlighting, cross-browser
**Out of scope**: Backend, authentication, mobile responsive, PDF export (Nice-to-have)
**Test environment**: Local browser (file:// hoặc localhost)

## Test Strategy
- [ ] Manual functional testing (QC) — chủ yếu
- [ ] Visual/UI review
- [ ] Cross-browser testing (Chrome, Firefox, Edge)
- [ ] Performance: load time check

---

## Test Cases

### TC-001: Mở presentation lần đầu
- **Preconditions**: `index.html` và `vendor/` folder tồn tại
- **Steps**:
  1. Mở `index.html` bằng Chrome
- **Expected Result**: Slide đầu tiên (title) hiển thị đúng, không có lỗi console
- **Priority**: P1 Critical
- **Status**: Not Run

### TC-002: Keyboard navigation → (next slide)
- **Preconditions**: Đang ở slide 1
- **Steps**:
  1. Nhấn phím →
- **Expected Result**: Chuyển sang slide 2, slide counter cập nhật
- **Priority**: P1 Critical
- **Status**: Not Run

### TC-003: Keyboard navigation ← (previous slide)
- **Preconditions**: Đang ở slide 2
- **Steps**:
  1. Nhấn phím ←
- **Expected Result**: Quay lại slide 1
- **Priority**: P1 Critical
- **Status**: Not Run

### TC-004: Space bar navigation
- **Preconditions**: Đang ở bất kỳ slide nào
- **Steps**:
  1. Nhấn Space
- **Expected Result**: Chuyển sang slide tiếp theo
- **Priority**: P2 High
- **Status**: Not Run

### TC-005: Navigate đến slide cuối rồi nhấn →
- **Preconditions**: Đang ở slide cuối
- **Steps**:
  1. Nhấn →
- **Expected Result**: Không có gì xảy ra (hoặc loop về đầu tùy config)
- **Priority**: P2 High
- **Status**: Not Run

### TC-006: Syntax highlighting hoạt động
- **Preconditions**: Navigate đến slide có code block
- **Steps**:
  1. Xem slide có code example (bash/shell commands)
- **Expected Result**: Code có màu sắc syntax highlighting, nền tối
- **Priority**: P2 High
- **Status**: Not Run

### TC-007: Fullscreen mode
- **Preconditions**: Presentation đang mở
- **Steps**:
  1. Nhấn F
- **Expected Result**: Browser vào fullscreen, slides fill màn hình
- **Priority**: P2 High
- **Status**: Not Run

### TC-008: Speaker notes
- **Preconditions**: Presentation đang mở
- **Steps**:
  1. Nhấn S
- **Expected Result**: Cửa sổ speaker view mở, hiển thị notes và slide tiếp theo
- **Priority**: P3 Medium
- **Status**: Not Run

### TC-009: Slide counter / progress bar
- **Preconditions**: Đang ở slide bất kỳ
- **Steps**:
  1. Kiểm tra bottom của slide
- **Expected Result**: Progress bar và slide number hiển thị đúng
- **Priority**: P2 High
- **Status**: Not Run

### TC-010: Offline mode (không có internet)
- **Preconditions**: Tắt internet hoặc block CDN
- **Steps**:
  1. Mở `index.html`
- **Expected Result**: Presentation vẫn load đầy đủ (do vendor local)
- **Priority**: P1 Critical
- **Status**: Not Run

### TC-011: Font size đủ lớn
- **Preconditions**: Presentation mở ở 1920x1080
- **Steps**:
  1. Đọc text trên slide từ 3m
- **Expected Result**: Headings ≥ 40px, body ≥ 24px, dễ đọc
- **Priority**: P2 High
- **Status**: Not Run

### TC-012: Cross-browser — Firefox
- **Preconditions**: Firefox installed
- **Steps**:
  1. Mở `index.html` trên Firefox
  2. Navigate qua 5 slides đầu
- **Expected Result**: Hiển thị giống Chrome, navigation hoạt động
- **Priority**: P2 High
- **Status**: Not Run

### TC-013: Content đầy đủ — Claude section
- **Preconditions**: Presentation mở
- **Steps**:
  1. Navigate qua toàn bộ phần Claude A-Z
- **Expected Result**: Đủ 10-12 slides, mỗi slide có heading + content
- **Priority**: P1 Critical
- **Status**: Not Run

### TC-014: Content đầy đủ — DW Toolkit section
- **Preconditions**: Presentation mở
- **Steps**:
  1. Navigate qua toàn bộ phần DW Toolkit
- **Expected Result**: Đủ 8-10 slides, bảng key skills hiển thị đúng
- **Priority**: P1 Critical
- **Status**: Not Run

---

## Regression Checklist

Project mới — không có regression testing cần thiết.

---

## Performance Criteria

| Metric | Target | Actual |
|--------|--------|--------|
| Initial page load | < 2s | |
| Slide transition | < 100ms | |

---

## Bug Report Template

```
**Bug**: [Tiêu đề ngắn gọn]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1.
**Expected**:
**Actual**:
**Environment**: [OS, Browser, Version]
**Screenshot**: [đính kèm]
```

---

## Sign-off Criteria
- [ ] TC-001, TC-002, TC-003, TC-010, TC-013, TC-014 (P1) tất cả PASS
- [ ] Không có Critical/High bugs open
- [ ] Offline mode hoạt động
- [ ] Content đủ 20+ slides tổng cộng
