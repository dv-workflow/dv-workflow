import { Request } from 'express'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

// BUG: Hàm này lưu cart vào session theo userId — nhưng khi user login,
// session bị regenerate (bảo mật) mà KHÔNG restore cart cũ từ guest session.
// Kết quả: cart bị trắng sau khi đăng nhập.
//
// Root cause: mergeGuestCart() không được gọi trong auth flow.
// Fix: Cần lưu guest cart TRƯỚC khi regenerate session, sau đó merge lại.

export function getCart(req: Request): CartItem[] {
  return (req.session as any).cart || []
}

export function addToCart(req: Request, item: CartItem): void {
  const cart = getCart(req)
  const existing = cart.find(i => i.productId === item.productId)

  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push(item)
  }

  ;(req.session as any).cart = cart
}

export function clearCart(req: Request): void {
  ;(req.session as any).cart = []
}

// Thiếu: hàm này tồn tại nhưng KHÔNG được gọi khi login
export function mergeGuestCart(guestCart: CartItem[], req: Request): void {
  const userCart = getCart(req)

  for (const guestItem of guestCart) {
    const existing = userCart.find(i => i.productId === guestItem.productId)
    if (existing) {
      existing.quantity += guestItem.quantity
    } else {
      userCart.push(guestItem)
    }
  }

  ;(req.session as any).cart = userCart
}
