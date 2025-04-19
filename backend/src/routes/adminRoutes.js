const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { User, Role, ActivityLog, LoginLog, Settings } = require('../models');
const { Op } = require('sequelize');

// User Management Routes
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, is_email_verified, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (is_email_verified !== undefined) {
      where.is_email_verified = is_email_verified === 'true';
    }
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'accountLocked', 'accountLockedUntil', 'loginAttempts'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description', 'level'],
        through: { attributes: [] },
        ...(role ? { where: { name: role } } : {})
      }]
    });

    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      status: user.accountLocked ? 'locked' : 'active'
    }));

    res.json({
      users: formattedUsers,
      total_pages: Math.ceil(total / limit),
      current_page: parseInt(page),
      total_users: total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get User Details
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update User Role
router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    await ActivityLog.create({
      userId: req.params.id,
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get User Login History
router.get('/users/:id/login-history', auth, isAdmin, async (req, res) => {
  try {
    const logs = await LoginLog.findAll({
      where: { user_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// Update User Status
router.patch('/users/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ status });

    // Log the status change
    await ActivityLog.create({
      user_id: req.params.id,
      action: 'status_update',
      details: { status },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update User Role
router.patch('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role_id } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    await user.setRoles([role]);

    // Log the role change
    await ActivityLog.create({
      user_id: req.params.id,
      action: 'role_update',
      details: { role_id, role_name: role.name },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete User
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();

    // Log the deletion
    await ActivityLog.create({
      user_id: req.params.id,
      action: 'user_delete',
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Role Management Routes
router.get('/roles', auth, isAdmin, async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'level', 'isSystemRole'],
      order: [['level', 'DESC']]
    });
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.post('/roles', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, level } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    const role = await Role.create({
      name,
      description,
      level: level || 1,
      isSystemRole: false
    });

    await ActivityLog.create({
      action: 'role_create',
      details: { role_id: role.id, role_name: role.name },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

router.put('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, level } = req.body;
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot modify system roles' });
    }

    // Check if new name conflicts with existing role
    if (name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ error: 'Role with this name already exists' });
      }
    }

    await role.update({ name, description, level });

    await ActivityLog.create({
      action: 'role_update',
      details: { role_id: role.id, role_name: role.name },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    await role.destroy();

    await ActivityLog.create({
      action: 'role_delete',
      details: { role_id: req.params.id },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// System Settings Routes
router.get('/settings', auth, isAdmin, async (req, res) => {
  try {
    const [settings] = await Settings.findOrCreate({
      where: {},
      defaults: {
        require_email_verification: false,
        enforce_2fa: false,
        enforce_2fa_by_role: [],
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: true
        },
        session_timeout: 3600 // 1 hour in seconds
      }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get Recent Login Logs
router.get('/login-logs', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: logs, count: total } = await LoginLog.findAndCountAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'first_name', 'last_name'],
        include: [{
          model: Role,
          attributes: ['name'],
          through: { attributes: [] }
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      logs: logs || [],
      total_pages: Math.ceil(total / limit),
      current_page: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ error: 'Failed to fetch login logs', details: error.message });
  }
});

// Get Activity Logs
router.get('/activity-logs', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, action } = req.query;
    const offset = (page - 1) * limit;
    const where = action ? { action } : {};

    const { rows: logs, count: total } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'performer',
        attributes: ['id', 'email', 'first_name', 'last_name'],
        include: [{
          model: Role,
          attributes: ['name'],
          through: { attributes: [] }
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      logs,
      total_pages: Math.ceil(total / limit),
      current_page: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Update Authentication Settings
router.put('/settings/auth', auth, isAdmin, async (req, res) => {
  try {
    const {
      require_email_verification,
      enforce_2fa,
      enforce_2fa_by_role,
      password_policy,
      session_timeout
    } = req.body;

    const [settings] = await Settings.findOrCreate({
      where: {},
      defaults: {}
    });

    await settings.update({
      require_email_verification,
      enforce_2fa,
      enforce_2fa_by_role,
      password_policy,
      session_timeout
    });

    // Log the settings update
    await ActivityLog.create({
      action: 'settings_update',
      details: { type: 'auth', ...req.body },
      performed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Resend Verification Email
router.post('/users/:id/resend-verification', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verificationToken = await user.generateEmailVerificationToken();
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);
    
    await ActivityLog.create({
      userId: req.params.id,
      action: 'VERIFICATION_EMAIL_RESENT'
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Role Management Routes
router.get('/roles', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows: roles, count: total } = await Role.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['level', 'DESC']]
    });

    res.json({
      roles,
      total_pages: Math.ceil(total / limit),
      current_page: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/roles', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, permissions, level } = req.body;
    const role = await Role.create({
      name,
      description,
      permissions,
      level,
      is_system_role: false
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot modify system roles' });
    }

    await role.update({ name, description, permissions });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export Logs
router.get('/logs/export', auth, isAdmin, async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.query;
    let logs;

    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (type === 'login') {
      logs = await LoginLog.find(query).sort({ timestamp: -1 });
    } else if (type === 'activity') {
      logs = await ActivityLog.find(query).sort({ timestamp: -1 });
    }

    if (format === 'csv') {
      // Convert logs to CSV format
      const csv = convertToCSV(logs);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${type}-logs.csv`);
      return res.send(csv);
    }

    // Default to JSON
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
