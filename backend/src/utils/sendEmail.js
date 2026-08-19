const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer configured via environment variables.
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email plain text content
 * @param {string} [options.html] - Email HTML content
 * @returns {Promise<void>}
 */
const sendEmail = async (options) => {
  // Do not attempt real SMTP connection during automated tests
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Create a transporter using SMTP config from .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Define email options
  const message = {
    from: `${process.env.SMTP_FROM_NAME || 'TaskFlow'} <${process.env.SMTP_FROM || 'noreply@taskflow.local'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Attach HTML if provided
  if (options.html) {
    message.html = options.html;
  }

  // Send the email
  const info = await transporter.sendMail(message);

  // In development/test mode without real credentials, log the message ID
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log('Message sent (Mock): %s', info.messageId);
  } else if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
    // If using Ethereal, log the preview URL so the user can easily read the email
    console.log('Ethereal Email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
