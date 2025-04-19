const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/users', userRoutes);  // User-specific routes like login, profile
router.use('/admin', adminRoutes); // Admin-only routes like user management, settings

// Auth routes at root level
router.use('/', userRoutes);       // Makes /login, /register available at root

module.exports = router;
