//helpers.js — Shared test utilities

const request  = require('supertest');
const User         = require('../models/User');
const Note         = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');
const File         = require('../models/File');

/** Create a verified user and return { user, token } */
const createUser = async (app, overrides = {}) => {
  const email    = overrides.email || `user_${Date.now()}_${Math.random().toString(36).slice(2)}@my.sliit.lk`;
  const password = overrides.password || 'password123';

  const user = await User.create({
    fullName: 'Test User', email, phoneNumber: '0771234567',
    password, isEmailVerified: true, role: 'student',
    ...overrides,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return { user, token: res.body.token };
};

/** Create a user WITH bank details (required to sell notes / host sessions) */
const createSellerUser = (app, overrides = {}) => createUser(app, {
  bankName: 'Commercial Bank', bankAccountNumber: '1234567890',
  bankBranch: 'Colombo', accountHolderName: 'Test Seller',
  ...overrides,
});

/** Save a dummy file to MongoDB and return the File document */
const saveDummyFile = async (userId, category = 'note') => {
  return File.create({
    filename: `${category}-${Date.now()}`,
    originalName: 'test.pdf',
    contentType: 'application/pdf',
    data: Buffer.from('dummy file content'),
    size: 100,
    uploadedBy: userId,
    category,
  });
};

/** Create a Note directly in DB */
const createNote = async (sellerId, overrides = {}) => {
  const file = await saveDummyFile(sellerId, 'note');
  return Note.create({
    title: 'IT3040 ITPM Lecture Notes',
    description: 'Complete lecture notes for ITPM module',
    category: 'IT', subject: 'IT3040', price: 500,
    seller: sellerId,
    fileUrl: `/api/files/${file._id}`,
    fileName: 'notes.pdf', fileSize: 100,
    fileType: 'application/pdf', isActive: true,
    ...overrides,
  });
};

/** Create a free Note (price = 0) */
const createFreeNote = (sellerId, overrides = {}) =>
  createNote(sellerId, { price: 0, title: 'Free IT Notes', ...overrides });

/** Create a KuppiSession directly in DB */
const createSession = async (hostId, overrides = {}) => {
  return KuppiSession.create({
    title: 'IT3010 Database Kuppi Session',
    description: 'Live tutoring on MongoDB and SQL',
    sessionType: 'B', category: 'IT', subject: 'IT3010',
    price: 300, host: hostId,
    msTeamsLink: 'https://teams.microsoft.com/test',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startTime: '10:00', duration: 90, maxParticipants: 20,
    isActive: true, ...overrides,
  });
};

/** Create a free KuppiSession (price = 0, type A) */
const createFreeSession = (hostId, overrides = {}) =>
  createSession(hostId, { price: 0, sessionType: 'A', title: 'Free SQL Kuppi', ...overrides });

/** Fake payment slip buffer — mimics a file upload */
const fakeSlipBuffer = () => Buffer.from('fake payment slip image data');

module.exports = {
  createUser, createSellerUser,
  createNote, createFreeNote,
  createSession, createFreeSession,
  saveDummyFile, fakeSlipBuffer,
};