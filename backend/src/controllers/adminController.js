const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const totalRoles = await Role.count();
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalRoles,
        newUsersToday
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

// Get all users with pagination and search
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    if (status) whereClause.status = status;

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        attributes: ['name'],
        where: role ? { name: role } : undefined
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      totalPages: Math.ceil(users.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role_names = ['user'] } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      status: 'active'
    });

    // Assign roles
    const roles = await Role.findAll({ where: { name: role_names } });
    await user.setRoles(roles);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: role_names
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, status, role_names } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user details
    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      email: email || user.email,
      status: status || user.status
    });

    // Update roles if provided
    if (role_names) {
      const roles = await Role.findAll({ where: { name: role_names } });
      await user.setRoles(roles);
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        status: user.status,
        roles: role_names
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json({ roles });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, level = 1 } = req.body;

    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      description,
      level,
      is_system_role: false
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ error: 'System roles cannot be modified' });
    }

    await role.update({
      name: name || role.name,
      description: description || role.description,
      level: level || role.level
    });

    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ error: 'System roles cannot be deleted' });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

// Get system settings
const getSettings = async (req, res) => {
  try {
    // Add your system settings logic here
    const settings = {
      // Example settings
      userRegistration: true,
      maxLoginAttempts: 5,
      sessionTimeout: 24,
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSymbols: true
      }
    };
    res.json({ settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update system settings
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    // Add your settings update logic here
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getSettings,
  updateSettings
}; 