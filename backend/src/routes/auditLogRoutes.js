const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const auditLogController = require('../controllers/auditLogController');
const { auth, checkRole, checkPermission } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');

// Rate limiting for audit logs (sensitive operations)
const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many audit log requests, please try again later'
});

// Apply rate limiting to all audit log routes
router.use(auditLimiter);

// Input validation schemas
const paginationSchema = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const dateFilterSchema = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

// Protected routes - Admin access required
router.get('/',
  auth,
  checkRole(['admin']),
  checkPermission('view_audit_logs'),
  [...paginationSchema, ...dateFilterSchema],
  validate,
  auditLogController.getAuditLogs
);

router.get('/:id',
  auth,
  checkRole(['admin']),
  checkPermission('view_audit_logs'),
  param('id').isUUID(),
  validate,
  auditLogController.getAuditLog
);

router.get('/user/:userId',
  auth,
  checkRole(['admin']),
  checkPermission('view_audit_logs'),
  [
    param('userId').isUUID(),
    ...paginationSchema,
    ...dateFilterSchema
  ],
  validate,
  auditLogController.getUserAuditLogs
);

router.get('/export/csv',
  auth,
  checkRole(['admin']),
  checkPermission('export_audit_logs'),
  [...dateFilterSchema],
  validate,
  auditLogController.exportAuditLogs
);

module.exports = router;