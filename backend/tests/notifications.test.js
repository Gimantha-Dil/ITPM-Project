//notifications.test.js — Notifications Module
const request      = require('supertest');
const app          = require('../server');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { createUser } = require('./helpers');

jest.mock('../utils/resendEmail', () => ({ sendOtpEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../utils/email', () => ({ sendPaymentVerifiedEmail: jest.fn().mockResolvedValue({}), sendPaymentRejectedEmail: jest.fn().mockResolvedValue({}), sendPurchaseNotificationEmail: jest.fn().mockResolvedValue({}) }));
jest.mock('../utils/pdfGenerator', () => ({ generateReceiptBuffer: jest.fn().mockResolvedValue({ buffer: Buffer.from('PDF'), filename: 'receipt.pdf' }) }));

let token, userId;

beforeAll(async () => {
  const result = await createUser(app);
  token  = result.token;
  userId = result.user._id;
});

afterAll(async () => { await User.deleteMany({}); });
afterEach(async () => { await Notification.deleteMany({}); });

const createNotif = (overrides = {}) => Notification.create({ recipient: userId, type: 'payment_verified', title: 'Test', message: 'Test message', read: false, ...overrides });

describe('User Journey 14: Notification Inbox', () => {

  describe('14a. Get Notifications', () => {
    test('empty inbox returns notifications=[] and unreadCount=0', async () => {
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(0);
      expect(res.body.unreadCount).toBe(0);
    });
    test('returns notifications with correct unread count', async () => {
      await createNotif({ read: false });
      await createNotif({ read: false });
      await createNotif({ read: true });
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(3);
      expect(res.body.unreadCount).toBe(2);
    });
    test('no token → 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('14b. Mark Single Notification as Read', () => {
    test('marks notification as read → read=true in DB', async () => {
      const notif = await createNotif({ read: false });
      await request(app).put(`/api/notifications/${notif._id}/read`).set('Authorization', `Bearer ${token}`);
      const updated = await Notification.findById(notif._id);
      expect(updated.read).toBe(true);
    });
    test('marking as read reduces unread count by 1', async () => {
      const notif = await createNotif({ read: false });
      await createNotif({ read: false });
      await request(app).put(`/api/notifications/${notif._id}/read`).set('Authorization', `Bearer ${token}`);
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.body.unreadCount).toBe(1);
    });
  });

  describe('14c. Mark All Notifications as Read', () => {
    test('all notifications become read → unreadCount=0', async () => {
      await createNotif({ read: false });
      await createNotif({ read: false });
      await createNotif({ read: false });
      await request(app).put('/api/notifications/mark-all-read').set('Authorization', `Bearer ${token}`);
      const unread = await Notification.countDocuments({ recipient: userId, read: false });
      expect(unread).toBe(0);
    });
    test('unread-count endpoint returns 0 after mark-all-read', async () => {
      await createNotif({ read: false });
      await request(app).put('/api/notifications/mark-all-read').set('Authorization', `Bearer ${token}`);
      const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  describe('14d. Delete Notification', () => {
    test('deletes notification → removed from DB', async () => {
      const notif = await createNotif();
      await request(app).delete(`/api/notifications/${notif._id}`).set('Authorization', `Bearer ${token}`);
      const found = await Notification.findById(notif._id);
      expect(found).toBeNull();
    });
    test('notification list shrinks after delete', async () => {
      const n1 = await createNotif();
      await createNotif();
      await request(app).delete(`/api/notifications/${n1._id}`).set('Authorization', `Bearer ${token}`);
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.body.notifications).toHaveLength(1);
    });
    test('delete without token → 401', async () => {
      const notif = await createNotif();
      const res = await request(app).delete(`/api/notifications/${notif._id}`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('14e. Unread Count Endpoint', () => {
    test('returns correct unread count', async () => {
      await createNotif({ read: false });
      await createNotif({ read: false });
      await createNotif({ read: true });
      const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);
    });
    test('returns 0 when all read', async () => {
      await createNotif({ read: true });
      await createNotif({ read: true });
      const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
      expect(res.body.count).toBe(0);
    });
  });
});