import { User } from '../users/user.model'

// Auth service hiện tại chỉ có email/password.
// Task: Thêm Google OAuth vào đây.

export interface AuthResult {
  user: User
  token: string
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResult | null> {
  // Giả lập: check DB
  if (email === 'test@example.com' && password === 'password') {
    const user: User = { id: 'u1', email, name: 'Test User', provider: 'email' }
    return { user, token: generateToken(user.id) }
  }
  return null
}

// Sẽ thêm: loginWithGoogle(code: string): Promise<AuthResult>
// Cần: Google OAuth client ID/secret từ config

function generateToken(userId: string): string {
  // Simplified — production dùng JWT
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64')
}
