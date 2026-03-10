# Context: google-oauth

## Ngày khảo sát: 2026-03-10 | Agent: researcher

---

## Yêu Cầu Gốc

Thêm Google OAuth 2.0 vào hệ thống auth hiện tại (email/password). Xem `google-oauth-requirements.md`.

## Files Liên Quan

| # | File | Vai trò | Cần thay đổi? |
|---|------|---------|----------------|
| 1 | `src/auth/auth.service.ts` | Email auth, generateToken | **Có** — thêm `loginWithGoogle()` |
| 2 | `src/auth/auth.routes.ts` | Route definitions | **Có** — thêm `/auth/google`, `/auth/google/callback` |
| 3 | `src/users/user.model.ts` | User type, DB operations | **Có** — thêm `googleId`, `findOrCreateGoogleUser()` |
| 4 | `src/config/env.ts` | Environment config | **Có** — thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| 5 | `src/app.ts` | App setup, session config | **Có** — thêm passport middleware |
| 6 | `src/__tests__/auth.test.ts` | Existing auth tests | **Có** — thêm OAuth test cases |

## Kiến Trúc Hiện Tại

```
Client → POST /auth/login (email+pass)
              ↓
         auth.service.loginWithEmail()
              ↓
         user lookup + password verify
              ↓
         generateToken() → JWT-like token
              ↓
         { user, token } → Client
```

## Kiến Trúc Sau Khi Thêm OAuth

```
Client → GET /auth/google
              ↓ redirect
         Google Authorization Server
              ↓ callback với code
         GET /auth/google/callback
              ↓
         Exchange code → access_token (Google API)
              ↓
         Get profile (email, name, googleId, avatar)
              ↓
         findOrCreateGoogleUser()  ← user.model.ts
              ↓
         generateToken()
              ↓
         Redirect → /dashboard?token=xxx
```

## Dependencies

**Upstream** (cần có):
- Google Cloud Console project với OAuth 2.0 credentials → Team cần setup
- `passport-google-oauth20` npm package → Thêm vào package.json
- `passport` npm package

**Downstream** (bị ảnh hưởng):
- Frontend: cần thêm "Login with Google" button và handle redirect
- User profile page: hiển thị `provider` badge và `avatarUrl`

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ |
|---------|--------|-------|
| Async/await | Tất cả async operations dùng async/await | `auth.service.ts` |
| Interface-first | Định nghĩa types trước khi implement | `User` interface |
| In-memory store | Dev dùng Map, có thể swap ra DB | `user.model.ts` |
| Factory function | Tạo entity qua factory, không dùng class | `createUser()` |

## Test Coverage Hiện Tại

- `src/__tests__/auth.test.ts`: 3 tests cho email login — đang PASS
- OAuth flow: chưa có test
- `user.model.ts`: không có tests (cần thêm cho `findOrCreateGoogleUser`)

## Giả Định

| # | Giả định | Cần kiểm chứng? |
|---|----------|-----------------|
| 1 | Dùng `passport-google-oauth20` thay vì raw OAuth | Không — TL đã quyết định |
| 2 | State parameter lưu trong session (không dùng Redis) | Không cho MVP |
| 3 | Frontend handle token via URL param (redirect) | Có — confirm với frontend team |

## Chưa Rõ

- [x] `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` — cần DevOps setup Google Cloud project
- [ ] Frontend redirect URL sau login thành công — cần confirm với frontend
