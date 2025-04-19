const { User, Role, AuditLog, Permission } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, name, email, role, status } = req.query;
        const where = {};
        
        if (name) {
            where.name = { [Op.like]: `%${name}%` };
        }
        if (email) {
            where.email = { [Op.like]: `%${email}%` };
        }
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }

        const users = await User.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: (page - 1) * limit,
        });

        res.json({
            total: users.count,
            users: users.rows,
            page: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'An error occurred while fetching users.' });
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId, {
            include: [{ model: Role }, { model: Permission }],
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'An error occurred while fetching user details.' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { roleId } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.roleId = roleId;
        await user.save();

        await AuditLog.create({
            user_id: req.user.id,
            action: 'update_role',
            entity_type: 'User',
            entity_id: userId,
            details: { message: 'User role updated' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || req.headers['user-agent'],
            status: 'success'
        });

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'An error occurred while updating user role.' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.status = status;
        await user.save();

        await AuditLog.create({
            user_id: req.user.id,
            action: 'update_status',
            entity_type: 'User',
            entity_id: userId,
            details: { message: 'User status updated' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || req.headers['user-agent'],
            status: 'success'
        });

        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'An error occurred while updating user status.' });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        await AuditLog.create({
            user_id: req.user.id,
            action: 'reset_password',
            entity_type: 'User',
            entity_id: userId,
            details: { message: 'User password reset' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || req.headers['user-agent'],
            status: 'success'
        });

        res.json({ message: 'User password reset successfully' });
    } catch (error) {
        console.error('Reset user password error:', error);
        res.status(500).json({ error: 'An error occurred while resetting user password.' });
    }
};

const resetUser2FA = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.twoFactorEnabled = false; // Assuming this is how 2FA is managed
        await user.save();

        await AuditLog.create({
            user_id: req.user.id,
            action: 'reset_2fa',
            entity_type: 'User',
            entity_id: userId,
            details: { message: 'User 2FA reset' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || req.headers['user-agent'],
            status: 'success'
        });

        res.json({ message: 'User 2FA reset successfully' });
    } catch (error) {
        console.error('Reset user 2FA error:', error);
        res.status(500).json({ error: 'An error occurred while resetting user 2FA.' });
    }
};

const updateAuthPolicy = async (req, res) => {
    try {
        const { twoFactorRequired, passwordComplexity } = req.body;

        // Update authentication policies in your settings (this is a placeholder)
        // You may need to implement a settings model or similar to store these values

        res.json({ message: 'Authentication policies updated successfully' });
    } catch (error) {
        console.error('Update auth policy error:', error);
        res.status(500).json({ error: 'An error occurred while updating authentication policies.' });
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      status: 'active',
      is_email_verified: false
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    // Log the registration
    await AuditLog.create({
      user_id: user.id,
      action: 'register',
      details: { message: 'User registered successfully' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Generate token for immediate login
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with roles
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // TODO: Re-enable email verification once email sending is implemented
    // if (!user.is_email_verified) {
    //   return res.status(403).json({ error: 'Please verify your email first' });
    // }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log the login
    await AuditLog.create({
      user_id: user.id,
      action: 'login',
      details: { message: 'User logged in successfully' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Add admin flags based on roles
    const userRoles = user.Roles.map(role => role.name);
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      is_email_verified: user.is_email_verified,
      roles: user.Roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description
      })),
      isAdmin: userRoles.includes('admin'),
      isSuperAdmin: userRoles.includes('super_admin')
    };

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    // Log the deletion
    await AuditLog.create({
      user_id: req.user.id,
      action: 'delete',
      entity_type: 'User',
      entity_id: userId,
      details: { message: 'User deleted' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || req.headers['user-agent'],
      status: 'success'
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    user.email_verified = true;
    await user.save();

    await AuditLog.create({
      user_id: user.id,
      action: 'verify',
      entity_type: 'User',
      entity_id: user.id,
      details: { message: 'Email verified' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || req.headers['user-agent'],
      status: 'success'
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ error: 'Token expired' });
    } 
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'An error occurred while verifying the email.' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    // TODO: Implement actual email sending logic here
    // sendVerificationEmail(user.email, verificationLink);
    
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'An error occurred while resending the verification email.' });
  }
};

const logout = async (req, res) => {
  try {
    // Log the logout action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'logout',
      details: { message: 'User logged out successfully' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'email',
        'first_name',
        'last_name',
        'status',
        'is_email_verified',
        'created_at',
        'updated_at'
      ],
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add admin flags based on roles
    const userRoles = user.Roles.map(role => role.name);
    const userData = {
      ...user.toJSON(),
      isAdmin: userRoles.includes('admin'),
      isSuperAdmin: userRoles.includes('super_admin')
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    deleteUser,
    verifyEmail,
    resendVerificationEmail,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
    resetUser2FA,
    updateAuthPolicy
};