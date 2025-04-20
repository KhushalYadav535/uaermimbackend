const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');

// Public routes (login, register)
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', auth, userRoutes);        // User-specific routes
router.use('/admin', auth, isAdmin, adminRoutes); // Admin-only routes

module.exports = router;
