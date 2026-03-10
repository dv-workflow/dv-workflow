# Test Plan: google-oauth

## Ngày: 2026-03-10 | QC: QC_X | Status: Draft

---

## Scope

**In scope**: Google OAuth login flow, account merge, error scenarios
**Out of scope**: Facebook/GitHub OAuth, Mobile OAuth, Admin panel
**Test environment**: Staging với Google OAuth test credentials

## Test Strategy

- [x] Unit tests (Dev viết trong ST-5)
- [x] Integration tests (Dev viết — mock Google API)
- [x] Manual functional testing (QC)
- [ ] Performance testing (không cần cho MVP)
- [x] Security testing (CSRF, token exposure)

---

## Test Cases

### TC-001: Đăng nhập Google — New User (Happy Path)
- **Preconditions**: User chưa có tài khoản, Google account hợp lệ
- **Steps**:
  1. Vào `/login`, click "Đăng nhập bằng Google"
  2. Chọn Google account trên consent screen
  3. Grant permission
- **Expected**: Redirect về `/dashboard`, user được tạo mới, avatar hiển thị
- **Priority**: P1 Critical | **Status**: Not Run

### TC-002: Đăng nhập Google — Existing Email User
- **Preconditions**: User đã có account `test@gmail.com` (email/pass), Google account cùng email
- **Steps**: Làm như TC-001 với cùng email
- **Expected**: Login thành công, dữ liệu cũ vẫn còn, KHÔNG tạo account mới
- **Priority**: P1 Critical | **Status**: Not Run

### TC-003: User hủy ở Google Consent Screen
- **Steps**: Click "Đăng nhập bằng Google" → Cancel ở Google screen
- **Expected**: Redirect về `/login?error=cancelled`, thông báo rõ ràng (không crash)
- **Priority**: P1 Critical | **Status**: Not Run

### TC-004: CSRF State Verification
- **Steps**: Giả lập callback request với state sai (tampered)
- **Expected**: 400 error, không tạo session, log security warning
- **Priority**: P1 Critical (Security) | **Status**: Not Run

### TC-005: Email Không Public Trong Google Account
- **Preconditions**: Google account không share email (privacy setting)
- **Expected**: Thông báo lỗi rõ ràng: "Không thể lấy email từ Google. Vui lòng thử cách đăng nhập khác."
- **Priority**: P2 High | **Status**: Not Run

### TC-006: Google Service Unavailable
- **Steps**: Mock Google API trả về 503
- **Expected**: Redirect về `/login?error=oauth_failed`, KHÔNG crash server
- **Priority**: P2 High | **Status**: Not Run

### TC-007: Link Google Account Vào Tài Khoản Email
- **Preconditions**: Đã login bằng email/pass
- **Steps**: Vào Profile → "Link Google Account" → OAuth flow
- **Expected**: Account linked, có thể login bằng cả hai cách
- **Priority**: P2 High | **Status**: Not Run

### TC-008: Avatar Hiển Thị Đúng
- **Steps**: Đăng nhập bằng Google có avatar
- **Expected**: Avatar từ Google hiển thị trong Profile và header
- **Priority**: P3 Medium | **Status**: Not Run

---

## Regression Checklist

| Feature | Quick Test | Status |
|---------|-----------|--------|
| Email/password login | Login với `test@example.com` | Not Run |
| Registration bằng email | Tạo account mới | Not Run |
| Protected routes | Truy cập `/dashboard` khi chưa login → redirect | Not Run |
| Logout | Click logout → session cleared | Not Run |

---

## Security Checklist

- [ ] Google access token KHÔNG được log ra console
- [ ] Google access token KHÔNG được lưu vào DB
- [ ] CSRF state parameter được verify (TC-004)
- [ ] Callback URL được whitelist trong Google Cloud Console
- [ ] Không có Google credentials trong source code

---

## Sign-off Criteria

- [ ] TC-001, TC-002, TC-003, TC-004 đều PASS (Critical path)
- [ ] Không có open P1 bugs
- [ ] Regression checklist clear
- [ ] Security checklist clear
