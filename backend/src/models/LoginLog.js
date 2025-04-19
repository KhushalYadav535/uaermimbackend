const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginLog = sequelize.define('LoginLog', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: {
      country: null,
      city: null,
      coordinates: {
        latitude: null,
        longitude: null
      }
    }
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    defaultValue: {
      browser: null,
      os: null,
      device: null
    }
  }
}, {
  timestamps: true,
  tableName: 'login_logs'
});

module.exports = LoginLog;
