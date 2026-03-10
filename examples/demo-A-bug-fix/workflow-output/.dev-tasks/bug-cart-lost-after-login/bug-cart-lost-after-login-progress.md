# Progress: bug-cart-lost-after-login

## Trạng thái: Done ✅
## Branch: fix/cart-lost-after-login
## Bắt đầu: 2026-03-10 09:15
## Kết thúc: 2026-03-10 10:05

---

## Debug Flow (theo /debug skill)

### Phase 1: Investigate
- Đọc bug report: "Cart trống sau khi login"
- Reproduce: thêm 2 items → login → GET /cart → `[]`
- Git log: không có thay đổi liên quan trong 7 ngày gần đây
- Scope: chỉ xảy ra khi login — guest cart hoạt động bình thường

### Phase 2: Diagnose
**Giả thuyết 1** *(Chọn đúng)*: Session regenerate xóa cart
→ Trace: `login()` → `req.session.regenerate()` → session mới, cart mất
→ Confirm: cart được lưu trong session, sau regenerate = session mới = cart `[]`

**Giả thuyết 2** *(Loại)*: `addToCart()` không save đúng
→ Disprove: guest cart hoạt động tốt, vấn đề chỉ sau login

**Root cause**: `mergeGuestCart()` tồn tại nhưng chưa được gọi trong login flow.

### Phase 3: Fix

**Test viết trước (TDD)** — `cart.test.ts` — FAIL ban đầu ✓

**Fix áp dụng** — `auth.middleware.ts`:
```diff
+ const guestCart = getCart(req)  // lưu trước khi regenerate

  req.session.regenerate((err) => {
    // ...
    ;(req.session as any).userId = user.id
+   mergeGuestCart(guestCart, req)  // restore sau regenerate
    // ...
  })
```

**Test kết quả**: 3/3 PASS ✓

## Subtask Progress

| # | Subtask | Trạng thái | Commit |
|---|---------|-----------|--------|
| 1 | Viết regression test | Done | `test: add cart-session regression test` |
| 2 | Fix auth.middleware.ts | Done | `fix(cart): restore cart after session regenerate` |

## Commits

```
abc1234  test: add regression test for cart lost after login
def5678  fix(cart): restore guest cart after session regenerate on login
```

## Debug Report

**Root Cause**: `req.session.regenerate()` trong login flow tạo session mới (đúng về security) nhưng không restore guest cart đã có trước đó. Hàm `mergeGuestCart()` trong `cart.service.ts` đã có sẵn nhưng chưa được gọi.

**Fix**: Lưu guest cart trước `regenerate()`, gọi `mergeGuestCart()` sau.

**Prevention**: Thêm integration test cho auth flow + cart. Review các chỗ dùng `session.regenerate()` khác trong codebase.

**Effort**: Estimate 2h → Actual 50 phút (root cause rõ ràng sau research)
