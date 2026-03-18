import { User } from '../users/user.model'

// =============================================================================
// [BEFORE STATE] — Trạng thái ban đầu trước khi implement Google OAuth.
// File này đại diện cho codebase HIỆN TẠI mà Dev sẽ extend trong task này.
// Sau khi /execute hoàn tất, AuthService sẽ được refactor thành class
// và thêm loginWithGoogle() — xem auth.routes.ts để biết AFTER state.
// =============================================================================

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
