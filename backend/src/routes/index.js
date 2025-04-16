const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');

// Mount user routes at /users
router.use('/users', userRoutes);

module.exports = router;
