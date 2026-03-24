const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"SLIIT Learning Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    return null;
  }
};

// Now accepts buffer instead of file path
const sendPaymentVerifiedEmail = async (buyerEmail, buyerName, itemTitle, itemType, receiptBuffer) => {
  const attachments = receiptBuffer ? [{
    filename: 'receipt.pdf',
    content: receiptBuffer,
    contentType: 'application/pdf'
  }] : [];

  return sendEmail({
    to: buyerEmail,
    subject: `Payment Verified - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;"> SLIIT Learning Platform</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Payment Verified! </h2>
          <p>Hi <strong>${buyerName}</strong>,</p>
          <p>Your payment for <strong>${itemTitle}</strong> has been verified successfully.</p>
          <p><strong>Type:</strong> ${itemType === 'note' ? ' Note' : ' Kuppi Session'}</p>
          ${itemType === 'note' 
            ? '<p>You can now <strong>download</strong> the note from your <strong>My Purchases</strong> page.</p>'
            : '<p>You can now <strong>join</strong> the session using the MS Teams link provided.</p>'
          }
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;"> Your receipt is attached to this email.</p>
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for using SLIIT Learning Platform!</p>
        </div>
      </div>
    `,
    attachments
  });
};

const sendPurchaseNotificationEmail = async (sellerEmail, sellerName, buyerName, itemTitle) => {
  return sendEmail({
    to: sellerEmail,
    subject: `New Purchase - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;"> SLIIT Learning Platform</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">New Purchase! </h2>
          <p>Hi <strong>${sellerName}</strong>,</p>
          <p><strong>${buyerName}</strong> has purchased your item: <strong>${itemTitle}</strong></p>
          <p>Please verify the payment slip in your seller dashboard.</p>
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #e65100;"> Payment is pending your verification.</p>
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for selling on SLIIT Learning Platform!</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendEmail, sendPaymentVerifiedEmail, sendPurchaseNotificationEmail };
