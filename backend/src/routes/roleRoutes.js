const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const roleController = require('../controllers/roleController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');

// Validation middleware
const validateRole = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('description').optional(),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
];

// Protected routes - Admin access required
router.post('/', auth, checkRole(['admin']), validateRole, roleController.createRole);
router.get('/', auth, checkRole(['admin']), roleController.getRoles);
router.get('/:id', auth, checkRole(['admin']), roleController.getRole);
router.put('/:id', auth, checkRole(['admin']), validateRole, roleController.updateRole);
router.delete('/:id', auth, checkRole(['admin']), roleController.deleteRole);

// Role assignment routes
router.post('/assign', auth, checkRole(['admin']), [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('roleId').notEmpty().withMessage('Role ID is required')
], roleController.assignRoleToUser);

router.post('/remove', auth, checkRole(['admin']), [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('roleId').notEmpty().withMessage('Role ID is required')
], roleController.removeRoleFromUser);

module.exports = router; 