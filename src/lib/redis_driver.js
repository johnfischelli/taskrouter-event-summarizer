const Redis = require('ioredis');
const genericPool = require("generic-pool");

const factory = {
  create: function() {
    let redisConfig = {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      db: 0
    }
    if (process.env.REDIS_URL !== undefined) {
      return new Redis(process.env.REDIS_URL);
    } else {
      return new Redis(redisConfig);
    }
  },
  destroy: function(client) {
    client.disconnect();
  }
};

const opts = {
  max: 20,
  min: 2
};

const myPool = genericPool.createPool(factory, opts);

module.exports = myPool;
