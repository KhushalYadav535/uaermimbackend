const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');

const initAdminAccounts = async () => {
  try {
    // Create or find admin role
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'Administrator role with full system access',
        level: 100
      }
    });

    // Create or find superadmin role
    const [superAdminRole] = await Role.findOrCreate({
      where: { name: 'super_admin' },
      defaults: {
        description: 'Super Administrator with highest level access',
        level: 1000
      }
    });

    // Create default admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        username: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        password: adminPassword,
        isActive: true,
        isEmailVerified: true
      }
    });

    // Create default superadmin user
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
    const [superAdminUser] = await User.findOrCreate({
      where: { email: 'superadmin@example.com' },
      defaults: {
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        password: superAdminPassword,
        isActive: true,
        isEmailVerified: true
      }
    });

    // Assign roles to users
    await adminUser.addRole(adminRole);
    await superAdminUser.addRole(superAdminRole);

    console.log('Default admin accounts initialized successfully');
  } catch (error) {
    console.error('Error initializing admin accounts:', error);
  }
};

module.exports = initAdminAccounts; 