const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING
    },
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_system_role'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true
  });

  Role.associate = (models) => {
    Role.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'users'
    });
  };

  return Role;
};