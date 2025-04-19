const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [8, 255],
      isStrongPassword(value) {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(value)) {
          throw new Error('Password must contain at least one lowercase letter, one uppercase letter, one number and one special character');
        }
      }
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    field: 'first_name'
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    field: 'last_name'
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_verified'
  },
  last_login: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'login_attempts'
  },
  account_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'account_locked'
  },
  account_locked_until: {
    type: DataTypes.DATE,
    field: 'account_locked_until'
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
      this.setDataValue('previous_passwords', JSON.stringify(value || []));
    }
  },
  passwordChangedAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['status'] },
    { fields: ['account_locked'] },
    { fields: ['created_at'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        // Check if password was used before
        for (const oldPassword of user.previousPasswords) {
          if (await bcrypt.compare(user.password, oldPassword)) {
            throw new Error('Cannot use previously used password');
          }
        }

        // Store previous passwords (last 5)
        const previousPasswords = user.previousPasswords || [];
        if (previousPasswords.length >= 5) {
          previousPasswords.shift();
        }
        previousPasswords.push(user.password);

        // Hash new password and update
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        user.previousPasswords = previousPasswords;
        user.passwordChangedAt = new Date();
      }
    }
  }
});

// Instance Methods
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.hasPasswordBeenUsed = async function (newPassword) {
  for (const oldPassword of this.previousPasswords) {
    if (await bcrypt.compare(newPassword, oldPassword)) {
      return true;
    }
  }
  return false;
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

// Class Methods
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

module.exports = User;