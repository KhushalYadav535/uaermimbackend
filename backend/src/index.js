const express = require('express');
const cors = require('./middleware/cors');
const routes = require('./routes');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors);

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 