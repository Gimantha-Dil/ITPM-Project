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

/* ───────────────────────────────────────────────
   PAYMENT VERIFIED EMAIL
─────────────────────────────────────────────── */
const sendPaymentVerifiedEmail = async (buyerEmail, buyerName, itemTitle, itemType, receiptBuffer) => {
  const attachments = receiptBuffer ? [{
    filename: 'receipt.pdf',
    content: receiptBuffer,
    contentType: 'application/pdf'
  }] : [];

  const actionLine = itemType === 'note'
    ? 'You can now <strong>download</strong> your note from the <strong>My Purchases</strong> page.'
    : 'You can now <strong>join</strong> the Kuppi session using the MS Teams link provided.';

  return sendEmail({
    to: buyerEmail,
    subject: `✅ Payment Verified – ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 32px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">🎓 SLIIT Learning Platform</h1>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #dcfce7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
          </div>

          <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px;">Payment Verified Successfully!</h2>
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px;">Hi <strong style="color: #111827;">${buyerName}</strong>, great news!</p>

          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              Your payment for <strong>${itemTitle}</strong> has been verified by the seller.
            </p>
          </div>

          <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">📌 <strong>What's next?</strong></p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 24px;">${actionLine}</p>

          <div style="background: #eff6ff; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="margin: 0; color: #1e40af; font-size: 13px;">📎 Your payment receipt is attached to this email as a PDF.</p>
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-purchases"
             style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Go to My Purchases →
          </a>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">Thank you for using SLIIT Learning Platform. If you have any questions, please contact support.</p>
        </div>
      </div>
    `,
    attachments
  });
};

/* ───────────────────────────────────────────────
   PAYMENT REJECTED EMAIL
─────────────────────────────────────────────── */
const sendPaymentRejectedEmail = async (buyerEmail, buyerName, itemTitle, itemType, itemId) => {
  const uploadLink = itemType === 'note'
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/notes/${itemId}`
    : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/kuppi-sessions/${itemId}`;

  return sendEmail({
    to: buyerEmail,
    subject: `❌ Payment Rejected – ${itemTitle} – Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 32px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">🎓 SLIIT Learning Platform</h1>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fee2e2; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">❌</div>
          </div>

          <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px;">Payment Slip Rejected</h2>
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px;">Hi <strong style="color: #111827;">${buyerName}</strong>,</p>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              Unfortunately, your payment slip for <strong>${itemTitle}</strong> has been <strong>rejected</strong> by the seller.
            </p>
          </div>

          <p style="color: #374151; font-size: 14px; margin: 0 0 6px;">📌 <strong>Possible reasons for rejection:</strong></p>
          <ul style="color: #374151; font-size: 14px; margin: 0 0 20px; padding-left: 20px; line-height: 1.8;">
            <li>The payment slip image was unclear or unreadable.</li>
            <li>The amount on the slip does not match the required amount.</li>
            <li>The slip was for a different transaction or item.</li>
            <li>The payment was not made to the correct bank account.</li>
          </ul>

          <p style="color: #374151; font-size: 14px; margin: 0 0 20px;">
            Please re-upload a <strong>valid and clear payment slip</strong> to complete your purchase.
          </p>

          <a href="${uploadLink}"
             style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Re-upload Payment Slip →
          </a>

          <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0;">
            If you believe this is a mistake or need assistance, please contact the seller directly through the platform.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">SLIIT Learning Platform — If you did not make this purchase, please ignore this email.</p>
        </div>
      </div>
    `
  });
};

/* ───────────────────────────────────────────────
   NEW PURCHASE NOTIFICATION (Seller)
─────────────────────────────────────────────── */
const sendPurchaseNotificationEmail = async (sellerEmail, sellerName, buyerName, itemTitle) => {
  return sendEmail({
    to: sellerEmail,
    subject: `🛒 New Purchase – ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 32px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🎓 SLIIT Learning Platform</h1>
        </div>
        <div style="padding: 36px 30px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px;">New Purchase Received!</h2>
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px;">Hi <strong style="color: #111827;">${sellerName}</strong>,</p>
          <div style="background: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>${buyerName}</strong> has purchased your item: <strong>${itemTitle}</strong>.<br/>
              Please review and verify the payment slip in your seller dashboard.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Thank you for selling on SLIIT Learning Platform!</p>
        </div>
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">SLIIT Learning Platform</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendEmail, sendPaymentVerifiedEmail, sendPaymentRejectedEmail, sendPurchaseNotificationEmail };