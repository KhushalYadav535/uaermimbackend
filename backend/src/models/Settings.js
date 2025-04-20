const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Settings = sequelize.define('Settings', {
    requireEmailVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'require_email_verification'
    },
    enforce2FA: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'enforce_2fa'
    },
    enforce2FAByRole: {
      type: DataTypes.JSONB,
      defaultValue: {
        admin: true,
        moderator: true,
        user: false
      },
      field: 'enforce_2fa_by_role'
    },
    allowedSocialLogins: {
      type: DataTypes.JSONB,
      defaultValue: {
        google: true,
        apple: true
      },
      field: 'allowed_social_logins'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    underscored: true
  });

  return Settings;
};
