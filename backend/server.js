require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./src/config/database');
const routes = require('./src/routes');
const { User, Role } = require('./src/models');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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