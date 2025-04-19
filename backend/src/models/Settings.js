const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
  requireEmailVerification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enforce2FA: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  enforce2FAByRole: {
    type: DataTypes.JSONB,
    defaultValue: {
      admin: true,
      moderator: true,
      user: false
    }
  },
  allowedSocialLogins: {
    type: DataTypes.JSONB,
    defaultValue: {
      google: true,
      apple: true
    }
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'settings'
});

module.exports = Settings;
