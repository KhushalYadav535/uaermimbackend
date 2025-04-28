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

    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

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

    // Set roles as array of role names for easier checking
    req.user = user;
    req.user.roles = user.Roles ? user.Roles.map(role => role.name) : [];
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

const isAdmin = async (req, res, next) => {
  try {
    // Check if user has admin or superadmin role
    if (!req.user.roles?.includes('admin') && !req.user.roles?.includes('super_admin')) {
      return res.status(403).json({ 
        errors: [{ msg: 'Access denied. Admin privileges required.' }]
      });
    }
    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error);
    res.status(500).json({ 
      errors: [{ msg: 'Internal server error' }]
    });
  }
};

module.exports = {
  auth,
  isAdmin
};
