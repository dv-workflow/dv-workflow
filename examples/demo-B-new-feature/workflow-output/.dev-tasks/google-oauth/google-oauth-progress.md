# Progress: google-oauth

## Trạng thái: Done ✅

## Branch: feat/google-oauth

## Bắt đầu: 2026-03-10 | Kết thúc: 2026-03-11

---

## Subtask Progress


| #    | Subtask                           | Trạng thái | Commit   | Người thực hiện  |
| ---- | --------------------------------- | ---------- | -------- | ---------------- |
| ST-1 | Dependencies + env config         | Done       | `a1b2c3` | DEV_X + Agent |
| ST-2 | User model — Google fields        | Done       | `d4e5f6` | Agent            |
| ST-3 | passport.config + loginWithGoogle | Done       | `g7h8i9` | Agent            |
| ST-4 | OAuth routes + CSRF               | Done       | `j1k2l3` | DEV_X + Agent |
| ST-5 | Tests                             | Done       | `m4n5o6` | Agent            |


## Effort Log


| Ngày       | Subtask | Loại    | Estimate | Actual | Ghi chú                                      |
| ---------- | ------- | ------- | -------- | ------ | -------------------------------------------- |
| 2026-03-10 | ST-1    | chore   | 0.5h     | 0.5h   | DevOps cung cấp credentials nhanh            |
| 2026-03-10 | ST-2    | coding  | 1h       | 1.5h   | Thêm unit tests cho findOrCreateGoogleUser   |
| 2026-03-10 | ST-3    | coding  | 1.5h     | 1h     | passport boilerplate đơn giản hơn dự kiến    |
| 2026-03-11 | ST-4    | coding  | 1h       | 1.5h   | CSRF state implementation mất thêm thời gian |
| 2026-03-11 | ST-5    | testing | 1.5h     | 2h     | Mock Google API phức tạp hơn expected        |


**Tổng**: Estimate 5.5h → Actual 6.5h (accuracy: 85%)

## Changelog

### 2026-03-10 — Phát hiện mới trong ST-4

- **Phát hiện**: Google OAuth callback URL phải match EXACTLY với whitelist trong Google Console (kể cả trailing slash)
- **Ảnh hưởng**: Cần DevOps update Google Console config với đúng staging URL
- **Hành động**: Ping DevOps → resolved trong 30 phút
- **Quyết định**: Thêm env var `GOOGLE_CALLBACK_URL` thay vì hardcode để dễ thay đổi per environment

### 2026-03-10 — TL arch-review feedback

- **Phát hiện**: Rate limiting thiếu cho `/auth/google` endpoint
- **Hành động**: Thêm `express-rate-limit` middleware cho auth routes (15 req/15min)
- **Không ảnh hưởng scope chính**, thêm vào ST-4

## Phát Hiện Mới


| #   | Phát hiện                                                 | Ảnh hưởng        | Hành động                           | Trạng thái |
| --- | --------------------------------------------------------- | ---------------- | ----------------------------------- | ---------- |
| 1   | Rate limiting cần thiết cho OAuth endpoints               | Security         | Thêm vào ST-4                       | Resolved   |
| 2   | Google callback URL phải exact match                      | Blocker tạm thời | DevOps update Console               | Resolved   |
| 3   | User có thể có googleId nhưng email khác (account switch) | Edge case        | Handle trong findOrCreateGoogleUser | Resolved   |


## Handoff Notes

### Session 2026-03-11 → Done

**Trạng thái**: Tất cả subtasks done, tất cả tests pass
**Commits**: 5 commits trên branch `feat/google-oauth`
**QC Testing**: Đang chờ QC_X chạy test plan (staging đã deploy)
**Bước tiếp theo**: QC sign-off → merge → deploy production

**Context quan trọng**:

- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` phải set trong `.env` (xem `.env.example`)
- Callback URL phải exact match: `https://staging.app.com/auth/google/callback`
- `findOrCreateGoogleUser()` handle email conflict tự động — không cần UI confirmation
- Rate limiting: 15 requests/15 minutes per IP cho `/auth/google`*

