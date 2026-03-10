/**
 * Regression test cho bug: "Cart bị mất sau khi đăng nhập"
 *
 * Test này được viết TRƯỚC khi fix (TDD approach theo /debug skill).
 * Khi chạy với code lỗi → FAIL
 * Sau khi fix → PASS
 */

import request from 'supertest'
import { app } from '../app'

describe('Cart - Session behavior', () => {
  let agent: ReturnType<typeof request.agent>

  beforeEach(() => {
    // agent giữ cookies giữa các requests (giả lập browser session)
    agent = request.agent(app)
  })

  // ✅ Test cơ bản - không liên quan đến bug
  test('should add items to cart as guest', async () => {
    const res = await agent
      .post('/cart/add')
      .send({ productId: 'p1', name: 'Áo thun', price: 150000, quantity: 2 })

    expect(res.status).toBe(200)
    expect(res.body.cart).toHaveLength(1)
    expect(res.body.cart[0].quantity).toBe(2)
  })

  // ❌ Test này FAIL với code hiện tại — expose bug
  test('should preserve cart items after login', async () => {
    // Step 1: Guest thêm hàng vào giỏ
    await agent
      .post('/cart/add')
      .send({ productId: 'p1', name: 'Áo thun', price: 150000, quantity: 2 })

    await agent
      .post('/cart/add')
      .send({ productId: 'p2', name: 'Quần jeans', price: 350000, quantity: 1 })

    // Verify giỏ có 2 items
    const beforeLogin = await agent.get('/cart')
    expect(beforeLogin.body.cart).toHaveLength(2)

    // Step 2: Đăng nhập
    await agent.post('/auth/login').send({ email: 'user@example.com', password: 'password123' })

    // Step 3: Kiểm tra giỏ hàng sau khi đăng nhập
    // BUG: cart trả về [] thay vì 2 items
    const afterLogin = await agent.get('/cart')
    expect(afterLogin.body.cart).toHaveLength(2)  // ← FAIL với code hiện tại
    expect(afterLogin.body.cart[0].productId).toBe('p1')
  })

  // Test merge: cả guest cart và user cart đều được giữ
  test('should merge duplicate items when logging in', async () => {
    await agent
      .post('/cart/add')
      .send({ productId: 'p1', name: 'Áo thun', price: 150000, quantity: 1 })

    await agent.post('/auth/login').send({ email: 'user@example.com', password: 'password123' })

    const res = await agent.get('/cart')
    expect(res.body.cart.find((i: any) => i.productId === 'p1').quantity).toBe(1)
  })
})
