const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // User-Role many-to-many relationship
      User.belongsToMany(models.Role, {
        through: 'user_roles',
        foreignKey: 'user_id',
        otherKey: 'role_id',
        as: 'roles'
      });
      
      // User-AuditLog one-to-many relationship
      User.hasMany(models.AuditLog, { foreignKey: 'user_id' });
      
      // User-LoginLog one-to-many relationship
      User.hasMany(models.LoginLog, { foreignKey: 'user_id' });
      
      // User-ActivityLog one-to-many relationship
      User.hasMany(models.ActivityLog, { foreignKey: 'user_id' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      field: 'reset_password_token'
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      field: 'reset_password_expires'
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'login_attempts'
    },
    account_locked_until: {
      type: DataTypes.DATE,
      field: 'account_locked_until'
    },
    account_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'account_locked'
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      field: 'two_factor_secret'
    },
    previous_passwords: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      field: 'previous_passwords',
      get() {
        const rawValue = this.getDataValue('previous_passwords');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('previous_passwords', JSON.stringify(value));
      }
    },
    passwordChangedAt: {
      type: DataTypes.DATE
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true, // "local", "google", "facebook", "twitter"
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true, // OAuth ID from provider
    },
    metadata: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['status'] },
      { fields: ['account_locked'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.incrementLoginAttempts = async function () {
    const updates = { loginAttempts: this.loginAttempts + 1 };

    if (updates.loginAttempts >= 5) {
      updates.accountLocked = true;
      updates.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    return await this.update(updates);
  };

  User.prototype.resetLoginAttempts = async function () {
    return await this.update({
      loginAttempts: 0,
      accountLocked: false,
      accountLockedUntil: null
    });
  };

  User.findByEmail = async function (email) {
    return await this.findOne({ where: { email } });
  };

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.twoFactorSecret;
    delete values.previousPasswords;
    return values;
  };

  return User;
};