const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { User, Role } = require('../models');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, first_name, last_name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        errors: [{ msg: 'User already exists with this email' }]
      });
    }

    // Generate username if not provided
    const finalUsername = username || email.split('@')[0];

    // Create user
    const user = await User.create({
      username: finalUsername,
      firstName: first_name, // Match model field names
      lastName: last_name,   // Match model field names
      email,
      password, // Password will be hashed by model hooks
      role: 'user',
      isEmailVerified: false,
      status: 'active'
    });

    // Get the default user role
    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (userRole) {
      await user.addRole(userRole);
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        roles: ['user']
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        roles: ['user'],
        isAdmin: false,
        isSuperAdmin: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error creating user account', error: error.message }]
    });
  }
});

// Admin login route
router.post('/admin/login', async (req, res) => {
  await superAdminController.authenticateSuperAdmin(req, res);
});

// Update the login route to match model fields
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt received:', { email });

    // Find user with roles
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.error('Login failed: User not found with email:', email);
      return res.status(401).json({
        errors: [{ msg: 'Invalid credentials' }]
      });
    }

    // Use the model's validatePassword method
    const isMatch = await user.validatePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.error('Login failed: Incorrect password for email:', email);
      return res.status(401).json({
        errors: [{ msg: 'Invalid credentials' }]
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.error('Login failed: User account is not active. Email:', email);
      return res.status(401).json({
        errors: [{ msg: 'Account is not active. Please contact administrator.' }]
      });
    }

    // Get user roles
    const userRoles = user.Roles.map(role => role.name);
    console.log('User roles:', userRoles);

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        roles: userRoles
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        roles: userRoles,
        isAdmin: userRoles.includes('admin'),
        isSuperAdmin: userRoles.includes('super_admin')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error logging in', error: error.message }]
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        errors: [{ msg: 'No token provided' }]
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle super admin case
    if (decoded.id === 'super_admin_1') {
      return res.json({
        user: {
          id: 'super_admin_1',
          email: decoded.email,
          role: 'super_admin',
          roles: ['super_admin'],
          isAdmin: true,
          isSuperAdmin: true,
          first_name: 'Super',
          last_name: 'Admin'
        }
      });
    }

    // Find user with roles
    const user = await User.findOne({
      where: { id: decoded.id },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).json({
        errors: [{ msg: 'User not found' }]
      });
    }

    // Get user roles
    const userRoles = user.Roles.map(role => role.name);

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: userRoles,
        isAdmin: userRoles.includes('admin'),
        isSuperAdmin: userRoles.includes('super_admin')
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        errors: [{ msg: 'Invalid token' }]
      });
    }
    console.error('Profile error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error fetching profile' }]
    });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/* Social Authentication Routes - Commented out for now
// Google Auth Routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// Facebook Auth Routes
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Facebook auth callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// Twitter Auth Routes
router.get(
  '/twitter',
  passport.authenticate('twitter')
);

router.get(
  '/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Twitter auth callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);
*/

module.exports = router;
