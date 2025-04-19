require('dotenv').config();  // Load environment variables from .env

// Load temporary config for development
require('./temp-config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./src/config/database');
const routes = require('./src/routes/index');
const { User, Role } = require('./src/models'); // Import models

const app = express();

// Security Middleware
app.use(helmet());



// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const createSuperAdmin = async () => {
  try {
    // Create or find the super admin role
    // Create super_admin role
    const [superAdminRole] = await Role.findOrCreate({
      where: { name: 'super_admin' },
      defaults: {
        description: 'Super Admin with all permissions',
        isSystemRole: true,
        level: 100
      }
    });

    // Create admin role
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'Admin with management permissions',
        isSystemRole: true,
        level: 50
      }
    });

    // Create user role
    const [userRole] = await Role.findOrCreate({
      where: { name: 'user' },
      defaults: {
        description: 'Regular user with basic permissions',
        isSystemRole: true,
        level: 1
      }
    });

    // Create or find the super admin user
    const devEmail = process.env.DEV_EMAIL || 'superadmin@example.com';
    const devPassword = process.env.DEV_PASSWORD || 'SuperAdmin123!';
    const [developer] = await User.findOrCreate({
      where: { email: devEmail },
      defaults: {
        first_name: 'Super',
        last_name: 'Admin',
        password: devPassword,
        status: 'active',
        is_email_verified: true
      }
    });

    // Create or find the admin user
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        first_name: 'System',
        last_name: 'Admin',
        password: 'Admin123!',
        status: 'active',
        is_email_verified: true
      }
    });

    // Assign roles
    await developer.setRoles([superAdminRole]);
    await admin.setRoles([adminRole]);

    // Reset account lock for super admin to ensure no lockout
    await developer.update({
      login_attempts: 0,
      account_locked: false,
      account_locked_until: null
    });

    console.log('Super admin setup completed.');
  } catch (error) {
    console.error('Failed to create super admin:', error);
  }
};

// Database and Server Startup
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const syncOptions = process.env.NODE_ENV === 'test' 
      ? { force: true }
      : process.env.NODE_ENV === 'development'
        ? { alter: true }
        : { alter: false };

    if (process.env.NODE_ENV === 'development') {
      // Only drop tables in development
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      await sequelize.query('DROP TABLE IF EXISTS users_backup;');
      await sequelize.query('DROP TABLE IF EXISTS users;');
      await sequelize.query('DROP TABLE IF EXISTS Role_backup;');
      await sequelize.query('DROP TABLE IF EXISTS Role;');
      await sequelize.query('DROP TABLE IF EXISTS UserRoles_backup;');
      await sequelize.query('DROP TABLE IF EXISTS UserRoles;');
      await sequelize.query('DROP TABLE IF EXISTS RolePermissions_backup;');
      await sequelize.query('DROP TABLE IF EXISTS RolePermissions;');
      await sequelize.query('DROP TABLE IF EXISTS Permission_backup;');
      await sequelize.query('DROP TABLE IF EXISTS Permission;');
      await sequelize.query('DROP TABLE IF EXISTS AuditLog_backup;');
      await sequelize.query('DROP TABLE IF EXISTS AuditLog;');
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }
    
    await sequelize.sync(syncOptions);
    console.log('Database synced');

    // Create super admin during server startup
    await createSuperAdmin();

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();