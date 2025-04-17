const { User, Role, AuditLog } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        field: 'email'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      isEmailVerified: false,
      loginAttempts: 0,
      accountLocked: false
    });

    // Assign default role
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (defaultRole) {
      await user.addRole(defaultRole);
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // TODO: Send verification email
    console.log('Verification token:', verificationToken);

    // Generate auth token for immediate login
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: false,
        isSuperAdmin: false
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log the registration
    await AuditLog.create({
      user_id: user.id,
      action: 'create',
      entity_type: 'User',
      entity_id: user.id,
      details: { message: 'New user registration' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || req.headers['user-agent'],
      status: 'success'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isAdmin: false,
        isSuperAdmin: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'An error occurred during registration. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    console.log(`Login attempt for email: ${email}`);

    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked, but bypass for superadmin
    const isSuperAdmin = user.Roles.some(role => role.name === 'superadmin');
    if (user.accountLocked && !isSuperAdmin) {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const timeLeft = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
        console.log(`Login failed: Account locked for email ${email}`);
        return res.status(403).json({
          error: 'Account is locked due to too many failed attempts',
          timeLeft: `${timeLeft} minutes`
        });
      } else {
        // Reset lock if time has passed
        user.accountLocked = false;
        user.loginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();
      }
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      console.log(`Login failed: Invalid password for email ${email}`);

      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.accountLocked = true;
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        return res.status(403).json({
          error: 'Too many failed attempts. Account locked for 30 minutes.'
        });
      }

      await user.save();
      return res.status(401).json({
        error: 'Invalid email or password',
        attemptsLeft: 5 - user.loginAttempts
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.accountLockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate token with more user info
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.Roles.some(role => role.name === 'admin'),
        isSuperAdmin: user.Roles.some(role => role.name === 'superadmin')
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    console.log(`Login successful for email: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.Roles.some(role => role.name === 'admin'),
        isSuperAdmin: user.Roles.some(role => role.name === 'superadmin')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send password reset email

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if password was used before
    const isOldPassword = await Promise.all(
      user.previousPasswords.map(async (oldPassword) => {
        return await bcrypt.compare(newPassword, oldPassword);
      })
    );

    if (isOldPassword.some(Boolean)) {
      return res.status(400).json({ error: 'Cannot use a previously used password' });
    }

    user.password = newPassword;
    user.previousPasswords = [...user.previousPasswords, user.password].slice(-5);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if password was used before
    const isOldPassword = await Promise.all(
      user.previousPasswords.map(async (oldPassword) => {
        return await bcrypt.compare(newPassword, oldPassword);
      })
    );

    if (isOldPassword.some(Boolean)) {
      return res.status(400).json({ error: 'Cannot use a previously used password' });
    }

    user.password = newPassword;
    user.previousPasswords = [...user.previousPasswords, user.password].slice(-5);
    await user.save();

    // TODO: Send password change notification email

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'previousPasswords'] },
      include: [{
        model: Role,
        through: { attributes: [] }
      }]
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = req.user;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: {
        userId: req.user.id,
        action: { [Op.like]: '%login%' }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    // Invalidate the token (if using a token blacklist, add it here)
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetAccountLock = async (req, res) => {
  try {
    const { email } = req.body;

    // Only super admin can reset account locks
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can reset account locks' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset the lock
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.accountLockedUntil = null;
    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user.id,
      action: 'reset_account_lock',
      details: `Account lock reset for user ${email}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Account lock reset successfully' });
  } catch (error) {
    console.error('Reset account lock error:', error);
    res.status(500).json({ error: 'An error occurred while resetting account lock' });
  }
};


module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  getLoginHistory,
  refreshToken,
  logout,
  resetAccountLock
};
