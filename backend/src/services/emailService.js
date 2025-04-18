const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  secure: false 
});

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"Sentient Digital" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email', error);
    throw error;
  }
};

module.exports = { sendMail };
