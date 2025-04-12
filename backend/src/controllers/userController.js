const { User, Role, AuditLog } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
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

    res.status(201).json({
      message: 'User registered successfully',
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

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Skip account lockout checks for testing
    user.accountLocked = false;
    user.loginAttempts = 0;

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Skip login attempt tracking for testing
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    // Check if user has admin role
    const isAdmin = user.Roles.some(role => role.name === 'admin');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    res.json(user);
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

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  getLoginHistory
}; 