const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const { User, Role, ActivityLog, LoginLog } = require('../models');
const { Op } = require('sequelize');

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many attempts, please try again later',
  skipSuccessfulRequests: true
});

// Shared password rules
const passwordRules = [
  body('password')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Must contain at least one number')
    .matches(/[\W_]/).withMessage('Must contain at least one special character')
];

// Validation middleware
const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  ...passwordRules,
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Auth routes
router.post('/register', validateRegister, authLimiter, userController.register);
router.post('/login', validateLogin, authLimiter, userController.login);
router.post('/logout', auth, userController.logout);

// Email verification routes
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerificationEmail);

// User management routes
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        errors: [{ msg: 'User not found' }]
      });
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error fetching profile data' }]
    });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        errors: [{ msg: 'User not found' }]
      });
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    await user.save();

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error updating profile' }]
    });
  }
});

router.delete('/:id', auth, userController.deleteUser);

// User activity routes
router.get('/activity-logs', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const logs = await ActivityLog.findAll({
      where: { userId: req.user.id },
      limit: parseInt(limit),
      order: [['timestamp', 'DESC']],
      include: [{
        model: User,
        as: 'performer',  // corrected alias to match association
        attributes: ['id', 'email', 'first_name', 'last_name'],
        required: false
      }]
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        timestamp: log.timestamp,
        user: log.User ? {
          id: log.User.id,
          email: log.User.email,
          name: `${log.User.first_name} ${log.User.last_name}`
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch activity logs',
      details: error.message 
    });
  }
});

router.get('/login-logs', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const logs = await LoginLog.findAll({
      where: { userId: req.user.id },
      limit: parseInt(limit),
      order: [['timestamp', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'email', 'first_name', 'last_name'],
        required: false
      }]
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        status: log.status,
        timestamp: log.timestamp,
        ip_address: log.ipAddress,
        location: log.location,
        device_info: log.deviceInfo,
        user: log.User ? {
          id: log.User.id,
          email: log.User.email,
          name: `${log.User.first_name} ${log.User.last_name}`
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching user login logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch login logs',
      details: error.message 
    });
  }
});

// Social media Login Routes 
// Google Login Route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback Route
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`/dashboard?token=${token}`);
});

// Facebook Login Route
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Facebook Callback Route
router.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`/dashboard?token=${token}`);
});

// Twitter Login Route
router.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter Callback Route
router.get('/auth/twitter/callback', passport.authenticate('twitter', { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`/dashboard?token=${token}`);
});

// Dashboard and profile routes
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        errors: [{ msg: 'User not found' }]
      });
    }

    // Get user stats (only for admin users)
    let stats = {};
    if (user.role === 'admin') {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const newUsers = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      });
      stats = { totalUsers, activeUsers, newUsers };
    } else {
      // For regular users, provide counts of their activity and login logs
      const activityCount = await ActivityLog.count({ where: { userId: user.id } });
      const loginCount = await LoginLog.count({ where: { userId: user.id } });
      stats = { activityCount, loginCount };
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      errors: [{ msg: 'Error fetching dashboard data' }]
    });
  }
});

module.exports = router;