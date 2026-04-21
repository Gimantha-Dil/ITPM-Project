//auth.test.js — Authentication & Security
const request = require('supertest');
const app  = require('../server');
const User = require('../models/User');
const { createUser } = require('./helpers');

jest.mock('../utils/resendEmail', () => ({ sendOtpEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../utils/email', () => ({
  sendPaymentVerifiedEmail: jest.fn().mockResolvedValue({}),
  sendPaymentRejectedEmail: jest.fn().mockResolvedValue({}),
  sendPurchaseNotificationEmail: jest.fn().mockResolvedValue({}),
}));
jest.mock('../utils/pdfGenerator', () => ({ generateReceiptBuffer: jest.fn().mockResolvedValue({ buffer: Buffer.from('PDF'), filename: 'receipt.pdf' }) }));

afterEach(async () => { await User.deleteMany({}); });

describe('User Journey 1: Student Registration', () => {

  describe('1a. SLIIT Email Validation', () => {

    test('accepts valid it prefix @my.sliit.lk email → 201 OTP sent', async () => {
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Gimantha Dilshan', email: 'it21000001@my.sliit.lk', phoneNumber: '0771234567', password: 'secure123' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toMatch(/OTP sent/i);
    });

    test('accepts valid eng prefix @my.sliit.lk email → 201', async () => {
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Eng Student', email: 'eng21100001@my.sliit.lk', phoneNumber: '0771234568', password: 'secure123' });
      expect(res.statusCode).toBe(201);
    });

    test('rejects Gmail address → 400 SLIIT email only', async () => {
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Test', email: 'student@gmail.com', phoneNumber: '0771234569', password: 'secure123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/SLIIT email/i);
    });

    test('rejects @sliit.lk without my subdomain → 400', async () => {
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Test', email: 'student@sliit.lk', phoneNumber: '0771234570', password: 'secure123' });
      expect(res.statusCode).toBe(400);
    });

    test('rejects already-verified duplicate email → 400', async () => {
      await new User({ fullName: 'Existing', email: 'it21000002@my.sliit.lk', phoneNumber: '0771234571', password: 'pass123', isEmailVerified: true }).save();
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Dup', email: 'it21000002@my.sliit.lk', phoneNumber: '0771234572', password: 'newpass123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already registered/i);
    });

    test('unverified email can re-register → 201', async () => {
      await new User({ fullName: 'Pending', email: 'it21000003@my.sliit.lk', phoneNumber: '0771234573', password: 'pass123', isEmailVerified: false, emailOtp: { code: '111111', expiresAt: new Date(Date.now() + 600000) } }).save();
      const res = await request(app).post('/api/auth/register').send({ fullName: 'Retry', email: 'it21000003@my.sliit.lk', phoneNumber: '0771234574', password: 'newpass123' });
      expect(res.statusCode).toBe(201);
    });
  });

  describe('1b. OTP Verification', () => {
    const EMAIL = 'it21000010@my.sliit.lk';
    const OTP   = '246810';
    beforeEach(async () => {
      await new User({ fullName: 'OTP Tester', email: EMAIL, phoneNumber: '0771000010', password: 'password123', isEmailVerified: false, emailOtp: { code: OTP, expiresAt: new Date(Date.now() + 600000) } }).save();
    });

    test('correct OTP → 200 + JWT token + isEmailVerified=true', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ email: EMAIL, otp: OTP });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.isEmailVerified).toBe(true);
    });
    test('correct OTP → password never exposed in response', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ email: EMAIL, otp: OTP });
      expect(res.body.user.password).toBeUndefined();
    });
    test('wrong OTP → 400 Invalid OTP', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ email: EMAIL, otp: '000000' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Invalid OTP/i);
    });
    test('expired OTP → 400 OTP expired', async () => {
      await User.findOneAndUpdate({ email: EMAIL }, { 'emailOtp.expiresAt': new Date(Date.now() - 1000) });
      const res = await request(app).post('/api/auth/verify-otp').send({ email: EMAIL, otp: OTP });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });
    test('unknown email → 404', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ email: 'nobody@my.sliit.lk', otp: OTP });
      expect(res.statusCode).toBe(404);
    });
  });
});

describe('User Journey 2: Login & JWT Security', () => {
  const EMAIL = 'it21000020@my.sliit.lk';
  beforeEach(async () => {
    await new User({ fullName: 'Login User', email: EMAIL, phoneNumber: '0771000020', password: 'mypassword123', isEmailVerified: true }).save();
  });

  test('correct credentials → 200 with JWT token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'mypassword123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toMatch(/successful/i);
  });
  test('wrong password → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });
  test('unknown email → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@my.sliit.lk', password: 'pass' });
    expect(res.statusCode).toBe(401);
  });
  test('valid JWT token → 200 profile returned', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'mypassword123' });
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(EMAIL);
    expect(res.body.password).toBeUndefined();
  });
  test('no token → 401 No token provided', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/No token/i);
  });
  test('tampered token → 401', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer fake.tampered.token');
    expect(res.statusCode).toBe(401);
  });
});

describe('User Journey 3: Role Management', () => {
  test('newly registered user has default role: student', async () => {
    const { token } = await createUser(app);
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.body.role).toBe('student');
  });
  test('admin user has role: admin in profile', async () => {
    const { token } = await createUser(app, { role: 'admin' });
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.body.role).toBe('admin');
  });
  test('password never returned in profile for any role', async () => {
    const { token: sToken } = await createUser(app, { role: 'student' });
    const { token: aToken } = await createUser(app, { role: 'admin' });
    const sRes = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${sToken}`);
    const aRes = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${aToken}`);
    expect(sRes.body.password).toBeUndefined();
    expect(aRes.body.password).toBeUndefined();
  });
});

describe('User Journey 4: Password Reset', () => {
  const EMAIL = 'it21000030@my.sliit.lk';
  beforeEach(async () => {
    await new User({ fullName: 'Reset Tester', email: EMAIL, phoneNumber: '0771000030', password: 'oldpassword123', isEmailVerified: true }).save();
  });

  test('unknown email → 404', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@my.sliit.lk' });
    expect(res.statusCode).toBe(404);
  });
  test('wrong reset OTP → 400 Invalid OTP', async () => {
    await User.findOneAndUpdate({ email: EMAIL }, { resetPasswordOtp: { code: '111111', expiresAt: new Date(Date.now() + 600000) } });
    const res = await request(app).post('/api/auth/reset-password').send({ email: EMAIL, otp: '999999', newPassword: 'newpass456' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Invalid OTP/i);
  });
  test('full flow: correct OTP → new password works → old password fails', async () => {
    await User.findOneAndUpdate({ email: EMAIL }, { resetPasswordOtp: { code: '654321', expiresAt: new Date(Date.now() + 600000) } });
    const resetRes = await request(app).post('/api/auth/reset-password').send({ email: EMAIL, otp: '654321', newPassword: 'newpassword456' });
    expect(resetRes.statusCode).toBe(200);
    const newLogin = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'newpassword456' });
    expect(newLogin.statusCode).toBe(200);
    expect(newLogin.body.token).toBeDefined();
    const oldLogin = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'oldpassword123' });
    expect(oldLogin.statusCode).toBe(401);
  });
});