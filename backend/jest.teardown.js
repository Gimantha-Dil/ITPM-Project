//jest.teardown.js — Global test teardown


const mongoose = require('mongoose');

module.exports = async () => {
  await mongoose.disconnect();
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }
};