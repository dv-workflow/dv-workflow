# Plan: google-oauth

## Ngày: 2026-03-10 | Trạng thái: Approved ✅
## Approved by: TL_X (arch-review 2026-03-10)

---

## Tóm Tắt Giải Pháp

Tích hợp Google OAuth 2.0 dùng `passport-google-oauth20`. Approach: Passport middleware xử lý OAuth flow, `findOrCreateGoogleUser()` trong user.model handle việc tạo/merge user, token generation giữ nguyên như email auth.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | `passport-google-oauth20` | Battle-tested, ít boilerplate, nhiều docs | Thêm dependency | **Chọn** |
| 2 | Raw OAuth 2.0 (fetch Google API trực tiếp) | Không dependency | Phức tạp hơn, cần handle token exchange, PKCE | Loại — quá complex cho MVP |
| 3 | Auth0 / Supabase Auth | Managed, ít code | Lock-in, chi phí, overkill | Loại — không phù hợp |

## Subtasks

### ST-1: Cài dependencies + env config
- **Mô tả**: `npm install passport passport-google-oauth20`, thêm env vars
- **Files**: `package.json`, `src/config/env.ts` (tạo mới)
- **Criteria**:
  - [ ] `import passport` không có TypeScript errors
  - [ ] `env.ts` export `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Dependencies**: none | **Estimate**: 30 phút

### ST-2: Cập nhật User model — thêm Google fields
- **Mô tả**: Thêm `googleId?`, `avatarUrl?` vào interface + `findOrCreateGoogleUser()` function
- **Files**: `src/users/user.model.ts`
- **Criteria**:
  - [ ] `User` interface có `googleId?` và `avatarUrl?`
  - [ ] `findOrCreateGoogleUser()` handle 3 cases: new user, existing email, existing googleId
  - [ ] Unit tests cho `findOrCreateGoogleUser()` pass
- **Dependencies**: ST-1 | **Estimate**: 1h

### ST-3: Implement Google OAuth trong auth.service
- **Mô tả**: Thêm `loginWithGoogle()`, setup passport strategy
- **Files**: `src/auth/auth.service.ts`, `src/auth/passport.config.ts` (tạo mới)
- **Criteria**:
  - [ ] Passport GoogleStrategy configured với client ID/secret
  - [ ] `loginWithGoogle(profile)` gọi `findOrCreateGoogleUser()` và return `AuthResult`
  - [ ] Không lưu Google access_token vào persistent storage
- **Dependencies**: ST-1, ST-2 | **Estimate**: 1.5h

### ST-4: Thêm OAuth routes
- **Mô tả**: Route `/auth/google` và `/auth/google/callback`
- **Files**: `src/auth/auth.routes.ts`, `src/app.ts`
- **Criteria**:
  - [ ] `GET /auth/google` → redirect Google consent screen
  - [ ] `GET /auth/google/callback` → xử lý callback, tạo token, redirect về frontend
  - [ ] CSRF state parameter được verify
  - [ ] Error handling: Google unavailable → redirect `/login?error=oauth_failed`
- **Dependencies**: ST-3 | **Estimate**: 1h

### ST-5: Tests
- **Mô tả**: Integration tests cho OAuth callback flow (mock Google API)
- **Files**: `src/__tests__/auth.test.ts`
- **Criteria**:
  - [ ] Test: new user via Google → user created, token returned
  - [ ] Test: existing email → account merged, không tạo duplicate
  - [ ] Test: invalid callback code → 400 error
  - [ ] Existing email tests vẫn pass
- **Dependencies**: ST-1 - ST-4 | **Estimate**: 1.5h

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Mitigation |
|---|------|--------|----------|----------|------------|
| 1 | Rủi ro | Google Cloud setup cần DevOps → có thể block | Trung bình | Cao | Dùng mock credentials cho dev, confirm với DevOps trước ST-1 |
| 2 | Giả định | Frontend handle token via URL param | — | Cao | Confirm với frontend trước ST-4 |
| 3 | Rủi ro | `passport-google-oauth20` types không compatible với Express version | Thấp | Thấp | Check peer dependencies trước install |

## Edge Cases

- [ ] User hủy OAuth ở Google consent screen → Google redirect về callback với `error=access_denied`
- [ ] Email không public trong Google account → profile thiếu email → báo lỗi rõ ràng
- [ ] Google account bị suspend → token hợp lệ nhưng profile trả về lỗi

## Tác Động Hệ Thống

- **Files thay đổi**: 5 files + 1 file mới (passport.config.ts)
- **API mới**: `GET /auth/google`, `GET /auth/google/callback`
- **DB changes**: Thêm field `googleId`, `avatarUrl` vào User (migration cần thiết ở production)
- **Breaking changes**: Không — email auth không thay đổi

## Estimation Tổng

| Phase | Estimate |
|-------|----------|
| Research | 1h (done) |
| Planning | 1h (done) |
| Coding (ST-1 đến ST-4) | 4h |
| Testing (ST-5) | 1.5h |
| Review | 1h |
| **Total** | **~8.5h** |

---
> **TL_X (arch-review)**: Approved. Lưu ý thêm rate limiting cho `/auth/google` endpoint (prevent abuse). ST-4 cần verify CSRF state — CRITICAL requirement.
