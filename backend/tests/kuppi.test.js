//kuppi.test.js — Kuppi Sessions
 
const request  = require('supertest');
const mongoose = require('mongoose');
const app          = require('../server');
const User         = require('../models/User');
const Note         = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');
const File         = require('../models/File');
const Notification = require('../models/Notification');
const { createUser, createSellerUser, createSession, createFreeSession, fakeSlipBuffer } = require('./helpers');

jest.mock('../utils/resendEmail', () => ({ sendOtpEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../utils/email', () => ({ sendPaymentVerifiedEmail: jest.fn().mockResolvedValue({}), sendPaymentRejectedEmail: jest.fn().mockResolvedValue({}), sendPurchaseNotificationEmail: jest.fn().mockResolvedValue({}) }));
jest.mock('../utils/pdfGenerator', () => ({ generateReceiptBuffer: jest.fn().mockResolvedValue({ buffer: Buffer.from('PDF'), filename: 'receipt.pdf' }) }));

afterEach(async () => { await Promise.all([User.deleteMany({}), Note.deleteMany({}), KuppiSession.deleteMany({}), File.deleteMany({}), Notification.deleteMany({})]); });

describe('User Journey 10: Browse & Create Kuppi Sessions', () => {
  test('returns empty list when no sessions', async () => {
    const res = await request(app).get('/api/kuppi');
    expect(res.statusCode).toBe(200);
    expect(res.body.sessions).toHaveLength(0);
  });
  test('returns active sessions with pagination', async () => {
    const { user: host } = await createSellerUser(app);
    await createSession(host._id, { title: 'Session A' });
    await createSession(host._id, { title: 'Session B' });
    const res = await request(app).get('/api/kuppi');
    expect(res.statusCode).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });
  test('?category=IT returns only IT sessions', async () => {
    const { user: host } = await createSellerUser(app);
    await createSession(host._id, { category: 'IT' });
    await createSession(host._id, { category: 'SE' });
    const res = await request(app).get('/api/kuppi?category=IT');
    expect(res.statusCode).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].category).toBe('IT');
  });
  test('?sessionType=A returns only Free sessions', async () => {
    const { user: host } = await createSellerUser(app);
    await createFreeSession(host._id);
    await createSession(host._id, { sessionType: 'B' });
    const res = await request(app).get('/api/kuppi?sessionType=A');
    expect(res.statusCode).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].sessionType).toBe('A');
  });
  test('non-existent session → 404', async () => {
    const res = await request(app).get(`/api/kuppi/${new mongoose.Types.ObjectId()}`);
    expect(res.statusCode).toBe(404);
  });
  test('user without bank details cannot create session → 403', async () => {
    const { token } = await createUser(app);
    const res = await request(app).post('/api/kuppi').set('Authorization', `Bearer ${token}`).send({ title: 'Kuppi', description: 'Desc', sessionType: 'B', category: 'IT', subject: 'IT3010', price: 300, date: new Date(Date.now() + 86400000).toISOString(), startTime: '10:00', duration: 90, maxParticipants: 20 });
    expect(res.statusCode).toBe(403);
    expect(res.body.requireBankDetails).toBe(true);
  });
  test('unauthenticated create session → 401', async () => {
    const res = await request(app).post('/api/kuppi').send({ title: 'Kuppi' });
    expect(res.statusCode).toBe(401);
  });
  test('host views own sessions at /user/my-sessions', async () => {
    const { user: host, token } = await createSellerUser(app);
    await createSession(host._id, { title: 'My Kuppi 1' });
    await createSession(host._id, { title: 'My Kuppi 2' });
    const res = await request(app).get('/api/kuppi/user/my-sessions').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('User Journey 11: Free Session Enrollment', () => {
  test('student enrolls free session → auto-verified immediately', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    const res = await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/enrolled/i);
    const updated = await KuppiSession.findById(session._id);
    expect(updated.enrollments[0].verified).toBe(true);
  });
  test('host cannot enroll own session → 400', async () => {
    const { user: host, token: hostToken } = await createSellerUser(app);
    const session = await createFreeSession(host._id);
    const res = await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${hostToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/own session/i);
  });
  test('student cannot enroll twice → 400', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    const res = await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already enrolled/i);
  });
  test('enrollment listed in /user/my-enrollments', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    const res = await request(app).get('/api/kuppi/user/my-enrollments').set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });
  test('session full → 400', async () => {
    const { user: host } = await createSellerUser(app);
    const session = await createFreeSession(host._id, { maxParticipants: 1 });
    const { token: s1 } = await createUser(app);
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${s1}`);
    const { token: s2 } = await createUser(app);
    const res = await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${s2}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/full/i);
  });
});

describe('User Journey 12: Paid Session Enrollment', () => {
  test('paid session requires payment slip → 400 if missing', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createSession(host._id, { price: 300, sessionType: 'B' });
    const res = await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Payment slip/i);
  });
  test('paid enrollment NOT auto-verified — awaits host approval', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createSession(host._id, { price: 300, sessionType: 'B' });
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const updated = await KuppiSession.findById(session._id);
    expect(updated.enrollments[0].verified).toBe(false);
  });
  test('paid enrollment → host receives enrollment notification', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const notif = await Notification.findOne({ recipient: host._id, type: 'enrollment' });
    expect(notif).not.toBeNull();
  });
});

describe('User Journey 13: Session Feedback', () => {
  test('student can leave feedback on a session', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    const res = await request(app).post(`/api/kuppi/${session._id}/feedback`).set('Authorization', `Bearer ${studentToken}`).send({ rating: 5, comment: 'Excellent!' });
    expect(res.statusCode).toBe(200);
    const updated = await KuppiSession.findById(session._id);
    expect(updated.feedback[0].rating).toBe(5);
  });
  test('duplicate feedback → 400', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/feedback`).set('Authorization', `Bearer ${studentToken}`).send({ rating: 4, comment: 'Good' });
    const res = await request(app).post(`/api/kuppi/${session._id}/feedback`).set('Authorization', `Bearer ${studentToken}`).send({ rating: 2, comment: 'Bad' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });
  test('feedback creates notification for host', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id);
    await request(app).post(`/api/kuppi/${session._id}/feedback`).set('Authorization', `Bearer ${studentToken}`).send({ rating: 5, comment: 'Great!' });
    const notif = await Notification.findOne({ recipient: host._id, type: 'new_feedback' });
    expect(notif).not.toBeNull();
  });
});