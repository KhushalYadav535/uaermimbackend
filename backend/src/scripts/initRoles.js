const { Role } = require('../models');

const initRoles = async () => {
  try {
    // Create default roles
    const roles = [
      {
        name: 'user',
        description: 'Regular user with basic access',
        isSystemRole: true,
        level: 1
      },
      {
        name: 'admin',
        description: 'Administrator with elevated privileges',
        isSystemRole: true,
        level: 100
      },
      {
        name: 'super_admin',
        description: 'Super administrator with full system access',
        isSystemRole: true,
        level: 1000
      }
    ];

    // Create roles if they don't exist
    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
    }

    console.log('Default roles initialized successfully');
  } catch (error) {
    console.error('Error initializing roles:', error);
    throw error;
  }
};

module.exports = initRoles; 