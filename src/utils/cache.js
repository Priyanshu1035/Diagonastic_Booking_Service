const { redisClient } = require('../config/redis');

const DEFAULT_TTL = 300; // 5 minutes

const getCache = async (key) => {
  try {
    if (!redisClient.isReady) {
      return null;
    }

    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Redis GET error for ${key}:`, error.message);
    return null;
  }
};

const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    if (!redisClient.isReady) {
      return;
    }

    await redisClient.setEx(
      key,
      ttl,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(`Redis SET error for ${key}:`, error.message);
  }
};

const deleteCache = async (key) => {
  try {
    if (!redisClient.isReady) {
      return;
    }

    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis DELETE error for ${key}:`, error.message);
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
};