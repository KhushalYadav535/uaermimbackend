const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.accountLocked) {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return res.status(403).json({ error: 'Account is locked. Please try again later.' });
      } else {
        user.accountLocked = false;
        user.loginAttempts = 0;
        await user.save();
      }
    }

    const userRoles = user.Roles.map(role => role.name);
    user.isAdmin = userRoles.includes('admin');
    user.isSuperAdmin = userRoles.includes('superadmin');

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication token has expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const userRoles = await user.getRoles();
      const hasRole = userRoles.some(role => roles.includes(role.name));

      if (!hasRole) {
        throw new Error('Access denied. Insufficient permissions.');
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(403).json({ error: error.message });
    }
  };
};

const checkPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const userRoles = await user.getRoles();
      const userPermissions = new Set();
      
      for (const role of userRoles) {
        const rolePermissions = await role.getPermissions();
        rolePermissions.forEach(permission => userPermissions.add(permission.name));
      }

      const hasPermission = permissions.every(permission => userPermissions.has(permission));
      if (!hasPermission) {
        throw new Error('Access denied. Insufficient permissions.');
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(403).json({ error: error.message });
    }
  };
};

module.exports = {
  auth,
  checkRole,
  checkPermission
};