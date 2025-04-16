const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

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
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  ...passwordRules.map(rule => rule.withMessage('New password requirements: ' + rule.message))
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  ...passwordRules
];

const validateToken = [
  param('token')
    .isJWT()
    .withMessage('Invalid token format')
];

// Public routes
router.post('/register', validateRegister, userController.register);
router.post('/login', authLimiter, validateLogin, userController.login);
router.get('/verify-email/:token', validateToken, userController.verifyEmail);
router.post('/request-password-reset', authLimiter, validatePasswordReset, userController.requestPasswordReset);
router.post('/reset-password', validateResetPassword, userController.resetPassword);
router.post('/refresh-token', userController.refreshToken);

// Logout endpoint
router.post('/logout', auth, userController.logout);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/change-password', auth, validateChangePassword, userController.changePassword);
router.get('/login-history', auth, userController.getLoginHistory);

// Admin routes
router.post('/reset-account-lock', auth, userController.resetAccountLock);


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


module.exports = router;