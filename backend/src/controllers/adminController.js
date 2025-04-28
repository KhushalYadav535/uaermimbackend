const { User, Role, ActivityLog, LoginLog, Settings, Permission } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// Get dashboard stats with detailed metrics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const totalRoles = await Role.count();
    
    // Get new users in last 24 hours
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Get user role distribution
    const roleDistribution = await Role.findAll({
      attributes: [
        'name',
        [sequelize.fn('COUNT', sequelize.col('users.id')), 'count']
      ],
      include: [{
        model: User,
        as: 'users',
        attributes: []
      }],
      group: ['Role.id']
    });

    // Get recent activity
    const recentActivity = await ActivityLog.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'performer',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalRoles,
        newUsersToday,
        roleDistribution,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

// Get all users with advanced filtering and search
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status, 
      role,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};

    // Search filter
    if (search) {
      whereClause = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Status filter
    if (status) whereClause.status = status;

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] },
        required: !!role,
        where: role ? { name: role } : undefined
      }],
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      attributes: { 
        exclude: ['password', 'resetToken', 'resetTokenExpiry', 'previous_passwords', 'two_factor_secret'] 
      }
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

// Create new user with roles
const createUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      roles,
      status = 'active'
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      status
    });

    // Assign roles
    if (roles && roles.length > 0) {
      const userRoles = await Role.findAll({
        where: { name: { [Op.in]: roles } }
      });
      await user.setRoles(userRoles);
    }

    // Log activity
    await ActivityLog.create({
      action: 'CREATE_USER',
      performerId: req.user.id,
      details: `Created user: ${email}`
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        roles: roles
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user details and roles
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      roles,
      status
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user details
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      status: status || user.status
    });

    // Update roles if provided
    if (roles && roles.length > 0) {
      const userRoles = await Role.findAll({
        where: { name: { [Op.in]: roles } }
      });
      await user.setRoles(userRoles);
    }

    // Log activity
    if (req.user && req.user.id && req.user.id !== 'super_admin_1') {
      console.log('Logging activity for user:', req.user.id);
      await ActivityLog.create({
        action: 'UPDATE_USER',
        userId: req.user.id,
        details: `Updated user: ${user.email}`
      });
    } else {
      console.warn('No valid req.user.id found or super admin user, skipping ActivityLog creation');
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        roles: roles
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

// Role management
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: User,
        as: 'users',
        attributes: ['id'],
        through: { attributes: [] }
      }],
      attributes: {
        include: [
          [
            sequelize.literal('(SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role_id = Role.id)'),
            'users_count'
          ]
        ]
      }
    });

    const formattedRoles = roles.map(role => ({
      ...role.toJSON(),
      users_count: role.get('users_count')
    }));

    res.json({ roles: formattedRoles });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      description,
      permissions
    });

    // Log activity
    await ActivityLog.create({
      action: 'CREATE_ROLE',
      performerId: req.user.id,
      details: `Created role: ${name}`
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

// System settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findAll();
    const formattedSettings = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({ settings: formattedSettings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await Settings.upsert({ key, value });
    }

    // Log activity
    if (req.user && req.user.id && req.user.id !== 'super_admin_1') {
      await ActivityLog.create({
        action: 'UPDATE_SETTINGS',
        userId: req.user.id,
        details: 'Updated system settings'
      });
    }

    res.json({
      message: 'Settings updated successfully',
      settings: updates
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });
    
    const roleStats = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']
      ],
      include: [{
        model: Role,
        attributes: ['name'],
        through: { attributes: [] }
      }],
      group: ['Role.name']
    });

    const newUsersPerMonth = await User.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6))
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))]
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleDistribution: roleStats,
        newUsersPerMonth
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
};

const getPermissions = async (req, res) => {
  try {
    // Assuming you have a Permission model
    const permissions = await Permission.findAll();
    res.json({ permissions });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
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
  getSettings,
  updateSettings,
  getUserStats,
  getPermissions
};
