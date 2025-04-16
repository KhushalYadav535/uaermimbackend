const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const permissionController = require('../controllers/permissionController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const audit = require('../middleware/audit');

// Rate limiting
const permLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many permission requests'
});

// Validation
const validatePermission = [
  body('name')
    .notEmpty().withMessage('Permission name is required')
    .isLength({ max: 50 }).withMessage('Name too long (max 50 chars)')
    .matches(/^[a-z_]+$/).withMessage('Only lowercase and underscore allowed'),
  body('description')
    .optional()
    .isLength({ max: 255 }).withMessage('Description too long'),
  body('module')
    .notEmpty().withMessage('Module is required')
    .isIn(['user', 'role', 'permission', 'content', 'settings']), // Configure your modules
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['create', 'read', 'update', 'delete', 'manage'])
];

// Apply rate limiting
router.use(permLimiter);

// CRUD Routes
router.post('/', 
  auth,
  checkRole(['admin']),
  checkPermission('manage_permissions'),
  audit,
  validatePermission,
  permissionController.createPermission
);

router.get('/', 
  auth,
  checkRole(['admin']),
  checkPermission('view_permissions'),
  permissionController.getPermissions
);

router.get('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('view_permissions'),
  permissionController.getPermission
);

router.put('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('manage_permissions'),
  audit,
  validatePermission,
  permissionController.updatePermission
);

router.delete('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('manage_permissions'),
  audit,
  permissionController.deletePermission
);

// Module-specific routes
router.get('/module/:module', 
  auth,
  checkRole(['admin']),
  param('module').isIn(['user', 'role', 'permission', 'content', 'settings']),
  permissionController.getPermissionsByModule
);

router.get('/modules/available', 
  auth,
  checkRole(['admin']),
  permissionController.getAvailableModules
);

module.exports = router;