require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models/pg');
const connectMongoDB = require('./config/mongodb');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');

    // Sync Sequelize models (creates tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('PostgreSQL tables synced');

    // Connect to MongoDB
    await connectMongoDB();

    // connecting Redis
    const redisConnected = await connectRedis();

    if(!redisConnected){
      console.warn('Redis Unavailable.Application will continue without caching.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
