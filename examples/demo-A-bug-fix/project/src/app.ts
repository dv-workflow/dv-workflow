import express from 'express'
import session from 'express-session'
import { addToCart, getCart } from './cart/cart.service'
import { login, requireAuth } from './auth/auth.middleware'

export const app = express()

app.use(express.json())
app.use(session({
  secret: 'demo-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

// Cart routes
app.post('/cart/add', (req, res) => {
  const { productId, name, price, quantity } = req.body
  addToCart(req, { productId, name, price, quantity })
  res.json({ cart: getCart(req) })
})

app.get('/cart', (req, res) => {
  res.json({ cart: getCart(req) })
})

// Auth routes
app.post('/auth/login', login)

app.get('/profile', requireAuth, (req, res) => {
  res.json({ userId: (req.session as any).userId, cart: getCart(req) })
})

export default app
