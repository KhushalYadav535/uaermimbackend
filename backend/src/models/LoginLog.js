const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.STRING,
      field: 'ip_address'
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
      field: 'device_info',
      defaultValue: {
        browser: null,
        os: null,
        device: null
      }
    }
  }, {
    tableName: 'login_logs',
    timestamps: true,
    underscored: true
  });

  return LoginLog;
};
