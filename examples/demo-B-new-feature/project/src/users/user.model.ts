export interface User {
  id: string
  email: string
  name: string
  provider: 'email' | 'google'  // sẽ thêm 'google' vào đây
  googleId?: string              // sẽ thêm field này
  avatarUrl?: string
  createdAt?: Date
}

// Simulated in-memory store (production dùng DB)
const users: Map<string, User> = new Map()

export function findByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(u => u.email === email)
}

export function findByGoogleId(googleId: string): User | undefined {
  return Array.from(users.values()).find(u => u.googleId === googleId)
}

export function createUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = {
    ...data,
    id: `u_${Date.now()}`,
    createdAt: new Date()
  }
  users.set(user.id, user)
  return user
}

export function findOrCreateGoogleUser(profile: {
  googleId: string
  email: string
  name: string
  avatarUrl?: string
}): User {
  // Tìm theo googleId trước
  let user = findByGoogleId(profile.googleId)
  if (user) return user

  // Nếu email đã tồn tại (user đã đăng ký bằng email) → link account
  user = findByEmail(profile.email)
  if (user) {
    user.googleId = profile.googleId
    user.provider = 'google'
    return user
  }

  // Tạo user mới
  return createUser({
    email: profile.email,
    name: profile.name,
    provider: 'google',
    googleId: profile.googleId,
    avatarUrl: profile.avatarUrl
  })
}
