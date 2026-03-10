# Context: bug-cart-lost-after-login

## Ngày khảo sát: 2026-03-10
## Agent: researcher | Level: 1 (Outsource/Maintenance)

---

## Yêu Cầu Gốc

> **Bug report từ QC:** Khi user thêm sản phẩm vào giỏ hàng (chưa đăng nhập), rồi đăng nhập — toàn bộ giỏ hàng bị trắng. Reproduce 100% trên staging.

## Files Liên Quan

| # | File | Vai trò | Cần thay đổi? |
|---|------|---------|----------------|
| 1 | `src/auth/auth.middleware.ts` | Xử lý login, session regenerate | **Có** — thiếu merge cart |
| 2 | `src/cart/cart.service.ts` | Cart CRUD, `mergeGuestCart()` | **Có** — hàm có nhưng không được gọi |
| 3 | `src/__tests__/cart.test.ts` | Test hiện tại | **Có** — thiếu regression test |

## Kiến Trúc Hiện Tại

```
User thêm cart (guest)
    ↓
req.session.cart = [items...]   ← lưu trong session
    ↓
User login → auth.middleware.login()
    ↓
req.session.regenerate()        ← VẤNT ĐỀ: session mới = cart mất
    ↓
req.session.userId = user.id   ← chỉ set userId, không restore cart
    ↓
Cart = []  ← mất hết
```

## Root Cause

`auth.middleware.ts` line 22: `req.session.regenerate()` tạo session mới (đúng về bảo mật để tránh session fixation), nhưng:
1. Không lưu `guestCart` TRƯỚC khi regenerate
2. Không gọi `mergeGuestCart()` SAU khi regenerate

Hàm `mergeGuestCart()` đã có sẵn trong `cart.service.ts` nhưng chưa bao giờ được gọi.

## Fix Plan

```typescript
// Trong auth.middleware.ts, hàm login():

// 1. Lưu guest cart TRƯỚC khi regenerate
const guestCart = getCart(req)  // ← thêm dòng này

req.session.regenerate((err) => {
  // ...
  ;(req.session as any).userId = user.id

  // 2. Merge guest cart vào session mới SAU khi regenerate
  mergeGuestCart(guestCart, req)  // ← thêm dòng này
  // ...
})
```

## Giả Định & Rủi ro

- **Giả định**: Guest cart lưu trong `req.session.cart` (confirmed đúng)
- **Rủi ro thấp**: Fix chỉ thêm 2 dòng, không thay đổi logic authentication
- **Edge case**: User đã có cart từ lần login trước — `mergeGuestCart()` handle tốt rồi

## Chưa Rõ

- Behavior khi user login từ 2 thiết bị cùng lúc → không liên quan đến bug này
