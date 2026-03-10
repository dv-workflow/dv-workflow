# Requirements: google-oauth

## Ngày: 2026-03-10 | Author: BA_X | Status: Approved by PM_X

---

## Business Context

**Goal**: Tăng tỷ lệ đăng ký người dùng mới — hiện tại form email/password có conversion rate thấp (~15%). Google OAuth kỳ vọng tăng lên 35-40%.

**Problem**: Users ngại tạo tài khoản mới (nhớ thêm password). Google OAuth "1-click" giảm friction đáng kể.

**Success Metrics**:
- Tỷ lệ đăng ký tăng ≥20% trong 30 ngày sau launch
- 0 security incidents liên quan đến OAuth flow
- Thời gian đăng ký < 5 giây

## Stakeholders

| Role | Nhu cầu | Priority |
|------|---------|---------|
| End User | Đăng nhập nhanh không cần nhớ password | Must-have |
| Admin | Xem user đăng ký qua Google vs email | Should-have |
| Dev Ops | Không cần infra mới, dùng Google Cloud | Must-have |

## User Stories

### Epic: Google OAuth Authentication

**US-001**: Đăng nhập bằng Google (happy path)
- **As**: Người dùng mới chưa có tài khoản
- **I want**: Click "Đăng nhập bằng Google" và hoàn tất trong 1 bước
- **So that**: Tôi có thể dùng app ngay mà không cần điền form
- **Acceptance Criteria**:
  - [x] Given user click "Login with Google", when Google redirect callback, then user được tạo account và đăng nhập tự động
  - [x] Given đăng nhập thành công, then redirect về dashboard (hoặc trang trước đó)
  - [x] Given email Google đã tồn tại (email/password), then accounts được merge, không tạo duplicate
- **Priority**: Must-have | **Estimate**: M

**US-002**: Link tài khoản Google vào account email hiện tại
- **As**: User đã có tài khoản email
- **I want**: Link Google account vào profile của mình
- **So that**: Tôi có thể đăng nhập bằng cả hai cách
- **Acceptance Criteria**:
  - [x] Given user đã login bằng email, khi vào Settings → "Link Google Account", then OAuth flow chạy và link thành công
  - [x] Given link thành công, then có thể login bằng Google và vẫn thấy đầy đủ dữ liệu cũ
- **Priority**: Should-have | **Estimate**: S

**US-003**: Hiển thị Google profile info
- **As**: User đăng nhập bằng Google
- **I want**: Avatar và tên từ Google được hiển thị trong profile
- **So that**: App cảm thấy personalized ngay
- **Acceptance Criteria**:
  - [x] Given đăng nhập bằng Google, then avatar URL được lưu và hiển thị
- **Priority**: Nice-to-have | **Estimate**: XS

## Non-Functional Requirements

| # | Requirement | Metric |
|---|------------|--------|
| NFR-1 | OAuth flow hoàn tất < 3s (không tính Google redirect) | p95 |
| NFR-2 | Không lưu Google access token vào DB | Security |
| NFR-3 | Hoạt động đúng khi Google unavailable (graceful error) | Availability |

## Out of Scope

- Facebook/GitHub OAuth (sprint sau)
- Mobile app OAuth (Web only)
- Admin impersonation

## Open Questions

- [x] Dùng Google OAuth 2.0 library nào? → `passport-google-oauth20` (TL quyết định)
- [x] State parameter để prevent CSRF? → Bắt buộc, implement trong session
- [ ] Token refresh strategy? → Không cần vì chỉ dùng để get profile một lần
