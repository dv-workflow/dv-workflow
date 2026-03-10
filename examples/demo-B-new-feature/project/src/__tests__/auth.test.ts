/**
 * Google OAuth Integration Tests
 *
 * Test cases per google-oauth-test-plan.md:
 * TC-001: New Google user → account created
 * TC-002: Existing Google user → login success
 * TC-003: Email conflict (same email, no googleId) → link accounts
 * TC-004: Invalid/expired OAuth token → error redirect
 * TC-005: Session preserved after Google login
 */

import { UserModel, User } from '../users/user.model';

// Mock UserModel to avoid real DB calls
jest.mock('../users/user.model');

const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

// Helper: build fake Google profile
function makeGoogleProfile(overrides: Partial<{
  id: string;
  displayName: string;
  email: string;
  photo: string;
}> = {}) {
  const defaults = {
    id: 'google-123',
    displayName: 'Nguyen Van A',
    email: 'vana@gmail.com',
    photo: 'https://lh3.googleusercontent.com/photo.jpg',
  };
  const data = { ...defaults, ...overrides };
  return {
    id: data.id,
    displayName: data.displayName,
    emails: [{ value: data.email }],
    photos: [{ value: data.photo }],
  } as any;
}

describe('UserModel.findOrCreateGoogleUser', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC-001: New Google user → account created, googleId saved
  it('should create new account for first-time Google login', async () => {
    MockedUserModel.findByGoogleId.mockResolvedValue(null);
    MockedUserModel.findByEmail.mockResolvedValue(null);

    const newUser: User = {
      id: 'user-new-1',
      email: 'vana@gmail.com',
      googleId: 'google-123',
      displayName: 'Nguyen Van A',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      createdAt: new Date(),
    };
    MockedUserModel.create.mockResolvedValue(newUser);

    const profile = makeGoogleProfile();
    const result = await UserModel.findOrCreateGoogleUser(profile);

    expect(MockedUserModel.findByGoogleId).toHaveBeenCalledWith('google-123');
    expect(MockedUserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        googleId: 'google-123',
        email: 'vana@gmail.com',
      })
    );
    expect(result.googleId).toBe('google-123');
    expect(result.id).toBe('user-new-1');
  });

  // TC-002: Returning Google user → login success, no duplicate created
  it('should return existing user on subsequent Google logins', async () => {
    const existingUser: User = {
      id: 'user-existing-1',
      email: 'vana@gmail.com',
      googleId: 'google-123',
      displayName: 'Nguyen Van A',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      createdAt: new Date(),
    };
    MockedUserModel.findByGoogleId.mockResolvedValue(existingUser);

    const profile = makeGoogleProfile();
    const result = await UserModel.findOrCreateGoogleUser(profile);

    expect(MockedUserModel.findByGoogleId).toHaveBeenCalledWith('google-123');
    expect(MockedUserModel.create).not.toHaveBeenCalled();
    expect(result.id).toBe('user-existing-1');
  });

  // TC-003: Email already registered (no googleId) → link account
  it('should link Google to existing email account', async () => {
    MockedUserModel.findByGoogleId.mockResolvedValue(null);

    const existingEmailUser: User = {
      id: 'user-email-1',
      email: 'vana@gmail.com',
      displayName: 'Nguyen Van A',
      createdAt: new Date(),
      // no googleId initially
    };
    MockedUserModel.findByEmail.mockResolvedValue(existingEmailUser);

    const linkedUser: User = {
      ...existingEmailUser,
      googleId: 'google-123',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    };
    MockedUserModel.linkGoogleId.mockResolvedValue(linkedUser);

    const profile = makeGoogleProfile();
    const result = await UserModel.findOrCreateGoogleUser(profile);

    expect(MockedUserModel.findByEmail).toHaveBeenCalledWith('vana@gmail.com');
    expect(MockedUserModel.linkGoogleId).toHaveBeenCalledWith(
      'user-email-1',
      'google-123',
      expect.any(String) // avatarUrl
    );
    expect(result.googleId).toBe('google-123');
    expect(result.id).toBe('user-email-1'); // same user, not new
  });

  // TC-004: Google profile missing email → throw error
  it('should throw if Google profile has no email', async () => {
    const profileNoEmail = {
      id: 'google-noemail',
      displayName: 'No Email User',
      emails: [],
      photos: [],
    } as any;

    MockedUserModel.findByGoogleId.mockResolvedValue(null);
    MockedUserModel.findByEmail.mockResolvedValue(null);

    await expect(UserModel.findOrCreateGoogleUser(profileNoEmail))
      .rejects
      .toThrow();
  });

  // TC-005: Verify returned user has all required fields
  it('should return user with all required session fields', async () => {
    const fullUser: User = {
      id: 'user-full-1',
      email: 'full@gmail.com',
      googleId: 'google-full',
      displayName: 'Full User',
      avatarUrl: 'https://photo.url',
      createdAt: new Date(),
    };
    MockedUserModel.findByGoogleId.mockResolvedValue(fullUser);

    const profile = makeGoogleProfile({ id: 'google-full', email: 'full@gmail.com' });
    const result = await UserModel.findOrCreateGoogleUser(profile);

    // These fields are required for passport.serializeUser
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('displayName');
  });

});
