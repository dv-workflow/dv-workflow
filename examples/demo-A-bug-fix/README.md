# Demo A: Bug Fix — Old-Maintenance Workflow

**Scenario**: Dự án web e-commerce đang chạy (maintenance phase). QC báo bug: "Giỏ hàng bị mất sau khi đăng nhập."

**Config**: Level 1 · old-maintenance template · Solo Dev + Agent

---

## Cấu Trúc

```
demo-A-bug-fix/
├── project/                      # Mini Express + TypeScript app (có bug thật)
│   └── src/
│       ├── app.ts
│       ├── cart/cart.service.ts  ← mergeGuestCart() có sẵn nhưng không được gọi
│       ├── auth/auth.middleware.ts ← BUG ở đây (session.regenerate không merge cart)
│       └── __tests__/cart.test.ts  ← regression test (FAIL trước fix, PASS sau)
│
└── workflow-output/              # Output thật của workflow sau khi chạy
    └── .dw/tasks/bug-cart-lost-after-login/
        ├── ...-context.md        # Research findings
        └── ...-progress.md       # Debug log + fix record
```

---

## Luồng Workflow Thực Tế

### Bước 0: Setup toolkit trong project

```bash
# Trong dự án thực của bạn:
git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow
bash .dw-module/integration-guide/setup.sh

# Chọn template old-maintenance
cp .dw-module/project-templates/old-maintenance/config/dw.config.yml .
# Sửa project.name trong config
```

### Bước 1: Nhận bug → `/task-init bug-cart-lost-after-login`

```
Agent tạo:
.dw/tasks/bug-cart-lost-after-login/
├── ...-context.md    (trống)
├── ...-plan.md       (trống — level 1 không enforce plan cho bugs)
└── ...-progress.md   (trống)
```

### Bước 2: Debug → `/debug "Cart trống sau khi login"`

Agent thực hiện **Investigate → Diagnose → Fix**:

```
Investigate:
  → Reproduce: POST /cart/add → POST /auth/login → GET /cart → []
  → Git log: không có thay đổi gần đây liên quan
  → Scope: chỉ xảy ra sau login, không phải khi guest

Diagnose:
  → Đọc auth.middleware.ts
  → Phát hiện: session.regenerate() tạo session mới → cart mất
  → Đọc cart.service.ts → mergeGuestCart() có nhưng KHÔNG được gọi
  → Root cause xác định!

Fix (TDD):
  1. Viết cart.test.ts → test "preserve cart after login" → FAIL ✓
  2. Sửa auth.middleware.ts: lưu guestCart trước regenerate, merge sau
  3. Test → PASS ✓
```

> Xem output: `workflow-output/.dw/tasks/bug-cart-lost-after-login/`

### Bước 3: Commit → `/commit`

```
Agent chạy:
  ✅ No sensitive data detected
  ✅ No debug code found
  → Tạo commits:
    test(cart): add regression test for cart lost after login
    fix(cart): restore guest cart after session regenerate on login
```

---

## Xem Bug Thật

```typescript
// src/auth/auth.middleware.ts — BUG
req.session.regenerate((err) => {
  // BUG: Chỉ set userId, KHÔNG restore cart
  ;(req.session as any).userId = user.id
  // Cart = [] vì session mới
})

// FIX
const guestCart = getCart(req)  // ← lưu trước
req.session.regenerate((err) => {
  ;(req.session as any).userId = user.id
  mergeGuestCart(guestCart, req)  // ← merge sau
})
```

## Chạy Test Để Thấy Bug

```bash
cd project
npm install
npm test

# Output với code lỗi:
# ✓ should add items to cart as guest
# ✗ should preserve cart items after login   ← FAIL
# ✗ should merge duplicate items when logging in ← FAIL
```

---

## Key Takeaways

- **Level 1 workflow** rất phù hợp cho bug fixes: không cần plan phức tạp
- **TDD trong /debug**: viết test trước để capture bug, sau đó fix
- **Context doc** ghi lại root cause, fix, và prevention → team sau biết tại sao code thay đổi
- **Toàn bộ workflow chạy trong ~50 phút** cho bug cỡ này
