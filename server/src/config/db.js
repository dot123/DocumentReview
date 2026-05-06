const { Sequelize } = require('sequelize');
const config = require('./index');
const { createClient } = require('redis');

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  timezone: '+08:00',
});

let redisClient = null;
let redisAvailable = true;

async function getRedis() {
  if (!redisAvailable) return null;
  if (!redisClient) {
    redisClient = createClient({
      socket: { host: config.redis.host, port: config.redis.port, connectTimeout: 3000 },
      password: config.redis.password || undefined,
    });
    redisClient.on('error', (err) => {
      console.warn('Redis错误:', err.message);
      redisAvailable = false;
      redisClient = null;
    });
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('Redis不可用，将跳过缓存');
      redisAvailable = false;
      redisClient = null;
    }
  }
  return redisAvailable ? redisClient : null;
}

module.exports = { sequelize, getRedis };
