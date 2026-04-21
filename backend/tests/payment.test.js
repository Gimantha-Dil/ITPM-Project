//payment.test.js — Payment Flows
const request  = require('supertest');
const app          = require('../server');
const User         = require('../models/User');
const Note         = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');
const File         = require('../models/File');
const Notification = require('../models/Notification');
const { createUser, createSellerUser, createNote, createSession, createFreeSession, fakeSlipBuffer } = require('./helpers');

jest.mock('../utils/resendEmail', () => ({ sendOtpEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../utils/email', () => ({ sendPaymentVerifiedEmail: jest.fn().mockResolvedValue({}), sendPaymentRejectedEmail: jest.fn().mockResolvedValue({}), sendPurchaseNotificationEmail: jest.fn().mockResolvedValue({}) }));
jest.mock('../utils/pdfGenerator', () => ({ generateReceiptBuffer: jest.fn().mockResolvedValue({ buffer: Buffer.from('PDF'), filename: 'receipt.pdf' }) }));

afterEach(async () => { await Promise.all([User.deleteMany({}), Note.deleteMany({}), KuppiSession.deleteMany({}), File.deleteMany({}), Notification.deleteMany({})]); });

const setupNotePurchase = async () => {
  const { user: seller, token: sellerToken } = await createSellerUser(app);
  const { user: buyer, token: buyerToken } = await createUser(app);
  const note = await createNote(seller._id);
  await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
  const updated = await Note.findById(note._id);
  return { seller, buyer, note, sellerToken, buyerToken, purchaseId: updated.purchases[0]._id };
};

const setupEnrollment = async () => {
  const { user: host, token: hostToken } = await createSellerUser(app);
  const { user: student, token: studentToken } = await createUser(app);
  const session = await createSession(host._id, { price: 300, sessionType: 'B' });
  await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
  const updated = await KuppiSession.findById(session._id);
  return { host, student, session, hostToken, studentToken, enrollmentId: updated.enrollments[0]._id };
};

describe('User Journey 15: Note Payment Verify & Reject', () => {

  describe('15a. Seller Verifies Payment', () => {
    test('seller verifies → verified=true, verifiedAt set', async () => {
      const { note, sellerToken, purchaseId } = await setupNotePurchase();
      const res = await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      expect(res.statusCode).toBe(200);
      const updated = await Note.findById(note._id);
      expect(updated.purchases[0].verified).toBe(true);
      expect(updated.purchases[0].verifiedAt).toBeDefined();
    });
    test('seller verifies → receiptUrl saved', async () => {
      const { note, sellerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const updated = await Note.findById(note._id);
      expect(updated.purchases[0].receiptUrl).toBeDefined();
      expect(updated.purchases[0].receiptUrl).toMatch(/^\/api\/files\//);
    });
    test('seller verifies → buyer receives payment_verified notification', async () => {
      const { buyer, note, sellerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const notif = await Notification.findOne({ recipient: buyer._id, type: 'payment_verified' });
      expect(notif).not.toBeNull();
    });
    test('non-seller cannot verify → 403', async () => {
      const { note, purchaseId } = await setupNotePurchase();
      const { token: otherToken } = await createUser(app);
      const res = await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${otherToken}`);
      expect(res.statusCode).toBe(403);
    });
    test('cannot verify already-verified payment → 400', async () => {
      const { note, sellerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const res = await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });
  });

  describe('15b. Seller Rejects Payment', () => {
    test('seller rejects → rejected=true, verified=false', async () => {
      const { note, sellerToken, purchaseId } = await setupNotePurchase();
      const res = await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      expect(res.statusCode).toBe(200);
      const updated = await Note.findById(note._id);
      expect(updated.purchases[0].rejected).toBe(true);
      expect(updated.purchases[0].verified).toBe(false);
      expect(updated.purchases[0].rejectedAt).toBeDefined();
    });
    test('seller rejects → buyer receives payment_unverified notification', async () => {
      const { buyer, note, sellerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const notif = await Notification.findOne({ recipient: buyer._id, type: 'payment_unverified' });
      expect(notif).not.toBeNull();
    });
    test('non-seller cannot reject → 403', async () => {
      const { note, purchaseId } = await setupNotePurchase();
      const { token: otherToken } = await createUser(app);
      const res = await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${otherToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('15c. Buyer Re-uploads Slip', () => {
    test('re-upload after rejection → rejected resets to false', async () => {
      const { note, sellerToken, buyerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const res = await request(app).post(`/api/notes/${note._id}/reupload-slip`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'new-slip.jpg');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/re-submitted/i);
      const updated = await Note.findById(note._id);
      expect(updated.purchases[0].rejected).toBe(false);
    });
    test('re-upload without slip → 400', async () => {
      const { note, sellerToken, buyerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const res = await request(app).post(`/api/notes/${note._id}/reupload-slip`).set('Authorization', `Bearer ${buyerToken}`);
      expect(res.statusCode).toBe(400);
    });
    test('re-upload on verified purchase → 400', async () => {
      const { note, sellerToken, buyerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/verify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      const res = await request(app).post(`/api/notes/${note._id}/reupload-slip`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });
    test('re-upload → seller receives new notification', async () => {
      const { seller, note, sellerToken, buyerToken, purchaseId } = await setupNotePurchase();
      await request(app).put(`/api/notes/${note._id}/unverify/${purchaseId}`).set('Authorization', `Bearer ${sellerToken}`);
      await Notification.deleteMany({ recipient: seller._id });
      await request(app).post(`/api/notes/${note._id}/reupload-slip`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'new-slip.jpg');
      const notif = await Notification.findOne({ recipient: seller._id, type: 'payment_received' });
      expect(notif).not.toBeNull();
    });
  });
});

describe('User Journey 16: Kuppi Payment Verify & Reject', () => {

  describe('16a. Host Verifies Enrollment', () => {
    test('host verifies → verified=true, verifiedAt set', async () => {
      const { session, hostToken, enrollmentId } = await setupEnrollment();
      const res = await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      expect(res.statusCode).toBe(200);
      const updated = await KuppiSession.findById(session._id);
      expect(updated.enrollments[0].verified).toBe(true);
      expect(updated.enrollments[0].verifiedAt).toBeDefined();
    });
    test('host verifies → receiptUrl saved', async () => {
      const { session, hostToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const updated = await KuppiSession.findById(session._id);
      expect(updated.enrollments[0].receiptUrl).toBeDefined();
      expect(updated.enrollments[0].receiptUrl).toMatch(/^\/api\/files\//);
    });
    test('host verifies → student receives payment_verified notification', async () => {
      const { student, session, hostToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const notif = await Notification.findOne({ recipient: student._id, type: 'payment_verified' });
      expect(notif).not.toBeNull();
    });
    test('non-host cannot verify → 403', async () => {
      const { session, enrollmentId } = await setupEnrollment();
      const { token: otherToken } = await createUser(app);
      const res = await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${otherToken}`);
      expect(res.statusCode).toBe(403);
    });
    test('cannot verify already-verified enrollment → 400', async () => {
      const { session, hostToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const res = await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });
  });

  describe('16b. Host Rejects Enrollment', () => {
    test('host rejects → rejected=true, verified=false', async () => {
      const { session, hostToken, enrollmentId } = await setupEnrollment();
      const res = await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      expect(res.statusCode).toBe(200);
      const updated = await KuppiSession.findById(session._id);
      expect(updated.enrollments[0].rejected).toBe(true);
      expect(updated.enrollments[0].verified).toBe(false);
    });
    test('host rejects → student receives payment_unverified notification', async () => {
      const { student, session, hostToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const notif = await Notification.findOne({ recipient: student._id, type: 'payment_unverified' });
      expect(notif).not.toBeNull();
    });
    test('non-host cannot reject → 403', async () => {
      const { session, enrollmentId } = await setupEnrollment();
      const { token: otherToken } = await createUser(app);
      const res = await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${otherToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('16c. Student Re-uploads Enrollment Slip', () => {
    test('re-upload after rejection → rejected resets to false', async () => {
      const { session, hostToken, studentToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const res = await request(app).post(`/api/kuppi/${session._id}/reupload-slip`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'new-slip.jpg');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/re-submitted/i);
      const updated = await KuppiSession.findById(session._id);
      expect(updated.enrollments[0].rejected).toBe(false);
    });
    test('re-upload without slip → 400', async () => {
      const { session, hostToken, studentToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const res = await request(app).post(`/api/kuppi/${session._id}/reupload-slip`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(400);
    });
    test('re-upload on verified → 400', async () => {
      const { session, hostToken, studentToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/verify/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      const res = await request(app).post(`/api/kuppi/${session._id}/reupload-slip`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });
    test('re-upload → host receives new payment_received notification', async () => {
      const { host, session, hostToken, studentToken, enrollmentId } = await setupEnrollment();
      await request(app).put(`/api/kuppi/${session._id}/reject/${enrollmentId}`).set('Authorization', `Bearer ${hostToken}`);
      await Notification.deleteMany({ recipient: host._id });
      await request(app).post(`/api/kuppi/${session._id}/reupload-slip`).set('Authorization', `Bearer ${studentToken}`).attach('paymentSlip', fakeSlipBuffer(), 'new-slip.jpg');
      const notif = await Notification.findOne({ recipient: host._id, type: 'payment_received' });
      expect(notif).not.toBeNull();
    });
  });
});

describe('User Journey 17: Payment History', () => {
  test('with token → returns user note purchases', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id, { title: 'IT3040 Notes' });
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get('/api/payments/history').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('note');
    expect(res.body[0].itemTitle).toBe('IT3040 Notes');
  });
  test('with token → returns user session enrollments', async () => {
    const { user: host } = await createSellerUser(app);
    const { token: studentToken } = await createUser(app);
    const session = await createFreeSession(host._id, { title: 'Free IT Kuppi' });
    await request(app).post(`/api/kuppi/${session._id}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    const res = await request(app).get('/api/payments/history').set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    const sessionItems = res.body.filter(p => p.type === 'session');
    expect(sessionItems).toHaveLength(1);
    expect(sessionItems[0].itemTitle).toBe('Free IT Kuppi');
  });
  test('history shows verified=false for pending payment', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get('/api/payments/history').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.body[0].verified).toBe(false);
  });
  test('history shows verified=true after seller verifies', async () => {
    const { user: seller, token: sellerToken } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const noteAfter = await Note.findById(note._id);
    await request(app).put(`/api/notes/${note._id}/verify/${noteAfter.purchases[0]._id}`).set('Authorization', `Bearer ${sellerToken}`);
    const res = await request(app).get('/api/payments/history').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.body[0].verified).toBe(true);
  });
  test('no token → returns all payments (admin view)', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get('/api/payments/history');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
  test('history sorted newest payment first', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note1 = await createNote(seller._id, { title: 'Note 1' });
    const note2 = await createNote(seller._id, { title: 'Note 2' });
    await request(app).post(`/api/notes/${note1._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    await new Promise(r => setTimeout(r, 20));
    await request(app).post(`/api/notes/${note2._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get('/api/payments/history').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.body).toHaveLength(2);
    const dates = res.body.map(p => new Date(p.date).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });
});