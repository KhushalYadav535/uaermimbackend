const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const superAdminController = require('../controllers/superAdminController');
const { verifySuperAdmin } = require('../middleware/superAdmin.js');
const rateLimit = require('express-rate-limit');

// Rate limiting to protect against brute-force attacks
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 requests per 15 minutes
    message: 'Too many requests, please try again later'
  });
  
  // Validation Middleware
  const validateUserCreation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'moderator', 'analyst']).withMessage('Invalid role')
  ];
  
  const validateRoleAssignment = [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(['admin', 'moderator', 'analyst']).withMessage('Invalid role')
  ];
  
  const validateFeatureToggle = [
    body('feature').isString().notEmpty().withMessage('Feature name is required'),
    body('enabled').isBoolean().withMessage('Enabled must be a boolean value')
  ];
  
  // Super Admin Authentication Route
  router.post('/login', adminLimiter, superAdminController.login);
  
  // Protected Routes - Requires Super Admin Verification
  router.use(verifySuperAdmin);
  
  // User Management Routes
  router.get('/users', superAdminController.getAllUsers); // Fetch all users
  router.post('/users', validateUserCreation, superAdminController.createUser); // Create a new user
  router.put('/users/:userId/assign-role', validateRoleAssignment, superAdminController.assignRole); // Assign a role
  router.delete('/users/:userId', superAdminController.deleteUser); // Delete a user
  
  // Role Management Routes
  router.get('/roles', superAdminController.getAllRoles); // Fetch all roles
  router.post('/roles', body('roleName').notEmpty().withMessage('Role name is required'), superAdminController.createRole); // Create a role
  router.delete('/roles/:roleId', superAdminController.deleteRole); // Delete a role
  
  // Feature Toggle Route
  router.post('/features/toggle', validateFeatureToggle, superAdminController.toggleFeature); // Enable/Disable feature
  
  // System Logs Route
  router.get('/logs', superAdminController.getSystemLogs); // Fetch system logs
  
  module.exports = router;