const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const { User, Role } = require('../models');

// Helper function to find or create user from social profile
const findOrCreateUser = async (profile, provider) => {
  try {
    let user = await User.findOne({
      where: {
        email: profile.emails[0].value
      }
    });

    if (!user) {
      // Get the default user role
      const userRole = await Role.findOne({ where: { name: 'user' } });

      // Create new user
      user = await User.create({
        email: profile.emails[0].value,
        first_name: profile.name.givenName || profile.displayName.split(' ')[0],
        last_name: profile.name.familyName || profile.displayName.split(' ')[1] || '',
        provider: provider,
        provider_id: profile.id,
        is_email_verified: true,
        status: 'active'
      });

      // Assign user role
      if (userRole) {
        await user.addRole(userRole);
      }
    }

    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
};

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'google');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'facebook');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Twitter Strategy
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/twitter/callback`,
    includeEmail: true
  },
  async (token, tokenSecret, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'twitter');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
