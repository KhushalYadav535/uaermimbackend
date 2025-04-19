const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const AuditLog = require('./AuditLog');
const Settings = require('./Settings');
const LoginLog = require('./LoginLog');
const ActivityLog = require('./ActivityLog');

// User-Role many-to-many relationship
User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });

// Role-Permission many-to-many relationship
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

// AuditLog-User relationship
AuditLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });

// LoginLog-User relationship
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' });

// ActivityLog-User relationship
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'performer' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });

module.exports = {
  User,
  Role,
  Permission,
  AuditLog,
  Settings,
  LoginLog,
  ActivityLog
};