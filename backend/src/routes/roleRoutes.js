const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const roleController = require('../controllers/roleController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const auditLog = require('../middleware/audit');

// Rate limiting
const roleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many role management requests'
});

// Validation
const validateRole = [
  body('name')
    .notEmpty().withMessage('Role name is required')
    .isLength({ max: 50 }).withMessage('Role name too long')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Only alphanumeric and underscore allowed'),
  body('description')
    .optional()
    .isLength({ max: 255 }).withMessage('Description too long'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array')
    .custom((value) => {
      if (value && value.some(isNaN)) {
        throw new Error('Permissions must be numeric IDs');
      }
      return true;
    })
];

// Apply rate limiting to all role routes
router.use(roleLimiter);

// Role CRUD
router.post('/', 
  auth, 
  checkRole(['admin']),
  checkPermission('manage_roles'),
  auditLog,
  validateRole,
  roleController.createRole
);

router.get('/', 
  auth,
  checkRole(['admin']),
  checkPermission('view_roles'),
  roleController.getRoles
);

router.get('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('view_roles'),
  roleController.getRole
);

router.put('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('manage_roles'),
  auditLog,
  validateRole,
  roleController.updateRole
);

router.delete('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('manage_roles'),
  auditLog,
  roleController.deleteRole
);

// Role assignment
router.post('/assign',
  auth,
  checkRole(['admin']),
  checkPermission('manage_roles'),
  auditLog,
  roleController.assignRoleToUser
);

router.post('/remove',
  auth,
  checkRole(['admin']),
  checkPermission('manage_roles'),
  auditLog,
  roleController.removeRoleFromUser
);

module.exports = router;