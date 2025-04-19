const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware executed');
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
    user.isSuperAdmin = userRoles.includes('super_admin');

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

const isAdmin = async (req, res, next) => {
  try {
    const userRoles = req.user.Roles.map(role => role.name);
    if (!userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      return res.status(403).json({ error: 'Access denied: admin privileges required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = req.user.Roles.map(role => role.name);
      const hasRole = roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({ error: 'Access denied: insufficient role' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

const checkPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userPermissions = await Permission.findAll({
        include: [{
          model: Role,
          required: true,
          include: [{
            model: User,
            required: true,
            where: { id: req.user.id }
          }]
        }]
      });

      const userPermissionNames = userPermissions.map(p => p.name);
      const hasPermission = permissions.some(p => userPermissionNames.includes(p));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  auth,
  isAdmin,
  checkRole,
  checkPermission
};