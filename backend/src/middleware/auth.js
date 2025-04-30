const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        errors: [{ msg: 'Authentication token is missing' }]
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle super admin case
    if (decoded.id === 'super_admin_1') {
      req.user = {
        id: 'super_admin_1',
        email: decoded.email,
        role: 'super_admin',
        isSuperAdmin: true,
        first_name: 'Super',
        last_name: 'Admin',
        status: 'active',
        roles: ['super_admin']
      };
      req.token = token;
      return next();
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        errors: [{ msg: 'User not found' }]
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        errors: [{ msg: 'Account is not active' }]
      });
    }

    // Add user and token to request
    req.user = user.toJSON();
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        errors: [{ msg: 'Invalid authentication token' }]
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        errors: [{ msg: 'Authentication token has expired' }]
      });
    }
    res.status(500).json({ 
      errors: [{ msg: 'Internal server error' }]
    });
  }
};

const isAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        errors: [{ msg: 'Access denied' }]
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        errors: [{ msg: 'Access denied' }]
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  auth,
  isAdmin
};
