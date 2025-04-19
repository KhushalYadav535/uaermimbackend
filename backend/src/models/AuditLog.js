const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'ip_address'
  },
  user_agent: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_agent'
  },
  status: {
    type: DataTypes.ENUM('success', 'failure'),
    allowNull: false,
    defaultValue: 'success'
  }
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'audit_logs_user_created_at_idx',
      fields: ['user_id', 'created_at']
    },
    {
      name: 'audit_logs_action_idx',
      fields: ['action']
    },
    {
      name: 'audit_logs_created_at_idx',
      fields: ['created_at']
    }
  ]
});

module.exports = AuditLog; 