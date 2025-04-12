const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');

// Protected routes - Admin access required
router.get('/', auth, checkRole(['admin']), auditLogController.getAuditLogs);
router.get('/:id', auth, checkRole(['admin']), auditLogController.getAuditLog);
router.get('/user/:userId', auth, checkRole(['admin']), auditLogController.getUserAuditLogs);
router.get('/export/csv', auth, checkRole(['admin']), auditLogController.exportAuditLogs);

module.exports = router; 