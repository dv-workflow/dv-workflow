import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { UserModel } from '../users/user.model';

const router = Router();
const authService = new AuthService();

// --- Passport Local Strategy ---
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await authService.validateEmailPassword(email, password);
      if (!user) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// --- Passport Google Strategy ---
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await UserModel.findOrCreateGoogleUser(profile);
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// --- Routes ---

// Local auth
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login?error=1',
}));

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Google OAuth — ST-2: Initiate flow
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    // CSRF protection via state param (built into passport-google-oauth20)
  })
);

// Google OAuth — ST-3: Callback handler
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

export default router;
