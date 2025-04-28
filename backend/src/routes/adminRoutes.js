const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { User, Role, ActivityLog, LoginLog, Settings } = require('../models');
const { Op } = require('sequelize');
const adminController = require('../controllers/adminController');

// Admin Dashboard Routes
router.get('/dashboard', auth, isAdmin, adminController.getDashboardStats);
router.get('/stats/users', auth, isAdmin, adminController.getUserStats);

// User Management Routes
router.get('/users', auth, isAdmin, adminController.getUsers);
router.post('/users', auth, isAdmin, adminController.createUser);
router.put('/users/:id', auth, isAdmin, adminController.updateUser);

// Role Management Routes
router.get('/roles', auth, isAdmin, adminController.getRoles);
router.post('/roles', auth, isAdmin, adminController.createRole);
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

// Permissions Route
router.get('/permissions', auth, isAdmin, adminController.getPermissions);

// System Settings Routes
router.get('/settings', auth, isAdmin, adminController.getSettings);
router.put('/settings', auth, isAdmin, adminController.updateSettings);

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
    const { role } = req.body; // changed from roleId to role to match frontend
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roleObj = await Role.findOne({ where: { name: role } }); // find role by name
    if (!roleObj) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await user.setRoles([roleObj]);
    
    await ActivityLog.create({
      userId: req.params.id,
      action: 'ROLE_UPDATE',
      details: `Role updated to ${roleObj.name}`,
      performedBy: req.user.id
    });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });

    res.json(updatedUser);
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
router.get('/roles', auth, isAdmin, adminController.getRoles);
router.post('/roles', auth, isAdmin, adminController.createRole);
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
router.get('/settings', auth, isAdmin, adminController.getSettings);
router.put('/settings', auth, isAdmin, adminController.updateSettings);

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
