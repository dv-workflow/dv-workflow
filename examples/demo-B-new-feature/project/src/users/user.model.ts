// =============================================================================
// [AFTER STATE] — User model sau khi implement Google OAuth (ST-2 completed).
// So với BEFORE: thêm googleId, avatarUrl, displayName; thêm UserModel class
// để dùng với Passport và dependency injection (xem auth.routes.ts).
// =============================================================================

export interface User {
  id: string
  email: string
  displayName: string           // đổi từ 'name' → 'displayName' theo Google profile
  provider?: 'email' | 'google'
  googleId?: string
  avatarUrl?: string
  createdAt?: Date
}

// Simulated in-memory store (production dùng DB)
const users: Map<string, User> = new Map()

// Plain functions (internal)
function _findByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(u => u.email === email)
}

function _findByGoogleId(googleId: string): User | undefined {
  return Array.from(users.values()).find(u => u.googleId === googleId)
}

function _findById(id: string): User | undefined {
  return users.get(id)
}

function _createUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = { ...data, id: `u_${Date.now()}`, createdAt: new Date() }
  users.set(user.id, user)
  return user
}

// Class-based API — dùng với Passport (serializeUser/deserializeUser) và tests
export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    return _findByEmail(email) ?? null
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    return _findByGoogleId(googleId) ?? null
  }

  static async findById(id: string): Promise<User | null> {
    return _findById(id) ?? null
  }

  static async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return _createUser(data)
  }

  static async linkGoogleId(userId: string, googleId: string, avatarUrl?: string): Promise<User> {
    const user = _findById(userId)
    if (!user) throw new Error(`User ${userId} not found`)
    user.googleId = googleId
    user.provider = 'google'
    if (avatarUrl) user.avatarUrl = avatarUrl
    return user
  }

  static async findOrCreateGoogleUser(profile: {
    id: string
    displayName: string
    emails: Array<{ value: string }>
    photos?: Array<{ value: string }>
  }): Promise<User> {
    const email = profile.emails[0]?.value
    if (!email) throw new Error('Google profile missing email')

    const avatarUrl = profile.photos?.[0]?.value

    // Tìm theo googleId trước
    let user = await UserModel.findByGoogleId(profile.id)
    if (user) return user

    // Email đã tồn tại → link account
    user = await UserModel.findByEmail(email)
    if (user) return UserModel.linkGoogleId(user.id, profile.id, avatarUrl)

    // Tạo user mới
    return UserModel.create({
      email,
      displayName: profile.displayName,
      provider: 'google',
      googleId: profile.id,
      avatarUrl,
    })
  }
}
