//jest.setup.js — Global test setup
 

// Load .env FIRST so we can override MONGODB_URI before server.js loads
require('dotenv').config();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Override BEFORE server.js connects — server.js reads this on import
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV    = 'test';
  process.env.JWT_SECRET  = process.env.JWT_SECRET || 'test_jwt_secret_key_123';

  // Connect mongoose here so server.js won't open a second connection
  await mongoose.connect(uri);

  global.__MONGO_SERVER__ = mongoServer;
};