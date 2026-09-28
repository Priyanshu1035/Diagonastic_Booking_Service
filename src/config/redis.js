const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('Redis Client Error:', error.message);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return false;
  }
};

module.exports = {
  redisClient,
  connectRedis,
};