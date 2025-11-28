const nodemailer = require('nodemailer');

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,   // smtp.gmail.com
      port: process.env.EMAIL_PORT,   // 587
      secure: false,                  // 465 ke liye true, 587 ke liye false
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Email send error:", err);
  }
};

module.exports = { sendMail };
