const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout', 'password_change'),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'entity_type'
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'entity_id'
  },
  details: {
    type: DataTypes.JSONB
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'failure'),
    allowNull: false,
    defaultValue: 'success'
  }
}, {
  timestamps: true,
  indexes: [
    {
      name: 'audit_logs_user_created_at_idx',
      fields: ['user_id', 'created_at']
    },
    {
      name: 'audit_logs_entity_idx',
      fields: ['entity_type', 'entity_id']
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