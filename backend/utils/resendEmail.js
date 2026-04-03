const { sendEmail } = require('./email');

const sendOtpEmail = async (toEmail, fullName, otp, type = 'verify') => {
  const subject = type === 'verify'
    ? 'SLIIT Learning Platform — Email Verification OTP'
    : 'SLIIT Learning Platform — Password Reset OTP';

  const heading = type === 'verify' ? 'Verify Your Email' : 'Reset Your Password';
  const message = type === 'verify'
    ? 'Use the OTP below to verify your email address.'
    : 'Use the OTP below to reset your password.';

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#f0fdff;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#63e5ff,#b1f2ff);padding:24px;text-align:center;">
          <h1 style="color:#0a4a57;margin:0;font-size:22px;">🎓 SLIIT Learning Platform</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#0a4a57;">${heading}</h2>
          <p style="color:#374151;">Hi <strong>${fullName}</strong>,</p>
          <p style="color:#374151;">${message}</p>
          <div style="background:#fff;border:2px solid #63e5ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your OTP Code</p>
            <h1 style="color:#0ab5d6;font-size:40px;letter-spacing:10px;margin:0;">${otp}</h1>
            <p style="color:#6b7280;font-size:12px;margin:8px 0 0;">Valid for 10 minutes</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendOtpEmail };