const express = require('express');
const router = express.Router();

// Import route files
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const auditLogRoutes = require('./auditLogRoutes');

// Setup routes
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
