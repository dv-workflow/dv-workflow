import { Request, Response, NextFunction } from 'express'
import { getCart } from '../cart/cart.service'

// Giả lập user store đơn giản
const users: Record<string, { id: string; email: string; passwordHash: string }> = {
  'user@example.com': { id: 'u1', email: 'user@example.com', passwordHash: 'hashed_pw' }
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body

  const user = users[email]
  if (!user || password !== 'password123') {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  // BUG IS HERE: Session regenerate để ngăn session fixation attack (đúng)
  // nhưng KHÔNG lưu guestCart trước khi regenerate,
  // và KHÔNG gọi mergeGuestCart() sau khi regenerate.
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: 'Session error' })
      return
    }

    // Chỉ set userId, không merge cart
    ;(req.session as any).userId = user.id
    ;(req.session as any).email = user.email

    // FIX sẽ là:
    // const guestCart = savedGuestCart  // Lưu trước khi regenerate
    // mergeGuestCart(guestCart, req)

    req.session.save(() => {
      res.json({ message: 'Logged in', userId: user.id })
    })
  })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
