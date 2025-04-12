const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const permissionController = require('../controllers/permissionController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');

// Validation middleware
const validatePermission = [
  body('name').notEmpty().withMessage('Permission name is required'),
  body('description').optional(),
  body('module').notEmpty().withMessage('Module is required'),
  body('action').notEmpty().withMessage('Action is required')
];

// Protected routes - Admin access required
router.post('/', auth, checkRole(['admin']), validatePermission, permissionController.createPermission);
router.get('/', auth, checkRole(['admin']), permissionController.getPermissions);
router.get('/:id', auth, checkRole(['admin']), permissionController.getPermission);
router.put('/:id', auth, checkRole(['admin']), validatePermission, permissionController.updatePermission);
router.delete('/:id', auth, checkRole(['admin']), permissionController.deletePermission);

// Module-specific routes
router.get('/module/:module', auth, checkRole(['admin']), permissionController.getPermissionsByModule);
router.get('/modules/available', auth, checkRole(['admin']), permissionController.getAvailableModules);

module.exports = router; 