const request  = require('supertest');
const mongoose = require('mongoose');
const app          = require('../server');
const User         = require('../models/User');
const Note         = require('../models/Note');
const File         = require('../models/File');
const Notification = require('../models/Notification');
const { createUser, createSellerUser, createNote, createFreeNote, fakeSlipBuffer } = require('./helpers');

jest.mock('../utils/resendEmail', () => ({ sendOtpEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../utils/email', () => ({ sendPaymentVerifiedEmail: jest.fn().mockResolvedValue({}), sendPaymentRejectedEmail: jest.fn().mockResolvedValue({}), sendPurchaseNotificationEmail: jest.fn().mockResolvedValue({}) }));
jest.mock('../utils/pdfGenerator', () => ({ generateReceiptBuffer: jest.fn().mockResolvedValue({ buffer: Buffer.from('PDF'), filename: 'receipt.pdf' }) }));

afterEach(async () => { await Promise.all([User.deleteMany({}), Note.deleteMany({}), File.deleteMany({}), Notification.deleteMany({})]); });

describe('User Journey 5: Browse Notes Marketplace', () => {
  test('returns empty list when no notes exist', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
  test('returns active notes with pagination info', async () => {
    const { user: seller } = await createSellerUser(app);
    await createNote(seller._id, { title: 'Note A' });
    await createNote(seller._id, { title: 'Note B' });
    const res = await request(app).get('/api/notes');
    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });
  test('?category=IT returns only IT category notes', async () => {
    const { user: seller } = await createSellerUser(app);
    await createNote(seller._id, { category: 'IT' });
    await createNote(seller._id, { category: 'SE' });
    const res = await request(app).get('/api/notes?category=IT');
    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toHaveLength(1);
    expect(res.body.notes[0].category).toBe('IT');
  });
  test('view count increments on each fetch', async () => {
    const { user: seller } = await createSellerUser(app);
    const note = await createNote(seller._id);
    await request(app).get(`/api/notes/${note._id}`);
    await request(app).get(`/api/notes/${note._id}`);
    const res = await request(app).get(`/api/notes/${note._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.views).toBe(3);
  });
  test('non-existent note → 404', async () => {
    const res = await request(app).get(`/api/notes/${new mongoose.Types.ObjectId()}`);
    expect(res.statusCode).toBe(404);
  });
  test('soft-deleted notes hidden from listing', async () => {
    const { user: seller } = await createSellerUser(app);
    await createNote(seller._id, { isActive: false });
    await createNote(seller._id, { isActive: true });
    const res = await request(app).get('/api/notes');
    expect(res.body.notes).toHaveLength(1);
  });
});

describe('User Journey 6: Seller Manages Notes', () => {
  test('seller views own notes at /user/my-notes', async () => {
    const { user: seller, token } = await createSellerUser(app);
    await createNote(seller._id, { title: 'Note 1' });
    await createNote(seller._id, { title: 'Note 2' });
    const res = await request(app).get('/api/notes/user/my-notes').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });
  test('user without bank details cannot create note → 403', async () => {
    const { token } = await createUser(app);
    const res = await request(app).post('/api/notes').set('Authorization', `Bearer ${token}`).attach('file', fakeSlipBuffer(), 'notes.pdf').field('title', 'T').field('description', 'D').field('category', 'IT').field('subject', 'IT3040').field('price', '500');
    expect(res.statusCode).toBe(403);
    expect(res.body.requireBankDetails).toBe(true);
  });
  test('unauthenticated create note → 401', async () => {
    const res = await request(app).post('/api/notes').attach('file', fakeSlipBuffer(), 'notes.pdf').field('title', 'Test');
    expect(res.statusCode).toBe(401);
  });
  test('seller soft-deletes own note → hidden from listing', async () => {
    const { user: seller, token } = await createSellerUser(app);
    const note = await createNote(seller._id);
    await request(app).delete(`/api/notes/${note._id}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/api/notes');
    expect(res.body.notes).toHaveLength(0);
  });
  test('other user cannot delete note → 403', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: otherToken } = await createUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).delete(`/api/notes/${note._id}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('User Journey 7: Buyer Purchases a Note', () => {
  test('buyer cannot purchase own note → 400', async () => {
    const { user: seller, token } = await createSellerUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${token}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/own note/i);
  });
  test('purchase without payment slip → 400', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Payment slip/i);
  });
  test('duplicate purchase → 400', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already purchased/i);
  });
  test('successful purchase → seller receives notification', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const notif = await Notification.findOne({ recipient: seller._id, type: 'payment_received' });
    expect(notif).not.toBeNull();
  });
  test('purchase listed in buyer /user/my-purchases', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get('/api/notes/user/my-purchases').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('User Journey 8: Download Access Control', () => {
  test('verified buyer can download → 200', async () => {
    const { user: seller, token: sellerToken } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const noteAfter = await Note.findById(note._id);
    await request(app).put(`/api/notes/${note._id}/verify/${noteAfter.purchases[0]._id}`).set('Authorization', `Bearer ${sellerToken}`);
    const res = await request(app).get(`/api/notes/${note._id}/download`).set('Authorization', `Bearer ${buyerToken}`);
    expect(res.statusCode).toBe(200);
  });
  test('unverified buyer cannot download → 403', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const res = await request(app).get(`/api/notes/${note._id}/download`).set('Authorization', `Bearer ${buyerToken}`);
    expect(res.statusCode).toBe(403);
  });
  test('non-buyer cannot download paid note → 403', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: strangerToken } = await createUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).get(`/api/notes/${note._id}/download`).set('Authorization', `Bearer ${strangerToken}`);
    expect(res.statusCode).toBe(403);
  });
  test('free note downloadable by anyone → 200', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: anyToken } = await createUser(app);
    const note = await createFreeNote(seller._id);
    const res = await request(app).get(`/api/notes/${note._id}/download`).set('Authorization', `Bearer ${anyToken}`);
    expect(res.statusCode).toBe(200);
  });
  test('seller can always download own note → 200', async () => {
    const { user: seller, token: sellerToken } = await createSellerUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).get(`/api/notes/${note._id}/download`).set('Authorization', `Bearer ${sellerToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('User Journey 9: Feedback & Ratings', () => {
  test('verified buyer can leave feedback', async () => {
    const { user: seller, token: sellerToken } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/purchase`).set('Authorization', `Bearer ${buyerToken}`).attach('paymentSlip', fakeSlipBuffer(), 'slip.jpg');
    const noteAfter = await Note.findById(note._id);
    await request(app).put(`/api/notes/${note._id}/verify/${noteAfter.purchases[0]._id}`).set('Authorization', `Bearer ${sellerToken}`);
    const res = await request(app).post(`/api/notes/${note._id}/feedback`).set('Authorization', `Bearer ${buyerToken}`).send({ rating: 5, comment: 'Very helpful!' });
    expect(res.statusCode).toBe(200);
    const updated = await Note.findById(note._id);
    expect(updated.feedback[0].rating).toBe(5);
  });
  test('unverified buyer cannot leave feedback → 403', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createNote(seller._id);
    const res = await request(app).post(`/api/notes/${note._id}/feedback`).set('Authorization', `Bearer ${buyerToken}`).send({ rating: 4, comment: 'Great' });
    expect(res.statusCode).toBe(403);
  });
  test('duplicate feedback → 400', async () => {
    const { user: seller } = await createSellerUser(app);
    const { token: buyerToken } = await createUser(app);
    const note = await createFreeNote(seller._id);
    await request(app).post(`/api/notes/${note._id}/feedback`).set('Authorization', `Bearer ${buyerToken}`).send({ rating: 4, comment: 'Good' });
    const res = await request(app).post(`/api/notes/${note._id}/feedback`).set('Authorization', `Bearer ${buyerToken}`).send({ rating: 3, comment: 'OK' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already given/i);
  });
});