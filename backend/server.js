require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./src/config/database');
const routes = require('./src/routes');
const { User, Role } = require('./src/models');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
  const allowedOrigins = [
      'https://usermim.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5000',
      'https://usermimbackend.onrender.com'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add logging middleware to trace incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync models with force:true only in development
    if (process.env.NODE_ENV === 'development') {
      // Commented out dropping database to preserve data
      // await sequelize.query('PRAGMA foreign_keys = OFF;');
      // await sequelize.drop();
      // await sequelize.query('PRAGMA foreign_keys = ON;');

      // Sync tables without force to avoid dropping data
      await sequelize.sync();

      // Ensure default roles exist
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (!adminRole) {
        await Role.bulkCreate([
          {
            id: '1',
            name: 'admin',
            description: 'Administrator',
            is_system_role: true,
            level: 100
          },
          {
            id: '2',
            name: 'user',
            description: 'Regular User',
            is_system_role: true,
            level: 1
          }
        ]);
        console.log('Default roles created');
      }

      console.log('Database synced without dropping tables');
    } else {
      // In production, just sync without force
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();