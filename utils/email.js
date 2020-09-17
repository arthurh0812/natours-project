const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email {
  constructor(user, urls) {
    this.from = `Arthur Hennig <${process.env.EMAIL_FROM}>`;
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.urls = urls;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // 1) Sendgrid
      return 1;
    } else if (process.env.NODE_ENV === 'development') {
      // 1) create a transporter
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    // 1) render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        welcomeUrl: this.urls.welcomeUrl,
        confirmationUrl: this.urls.confirmationUrl,
        resetPasswordUrl: this.urls.resetPasswordUrl,
        subject: subject,
      }
    );

    // 2) define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: htmlToText.fromString(html),
      html: html,
    };

    // 3) use transport and send email
    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the NATOURS Family!!');
  }

  async sendResendEmail() {
    await this.send(
      'resendEmail',
      'Resend the Email Confirmation (expires in 30 minutes)'
    );
  }

  async sendResetPassword() {
    await this.send(
      'resetPassword',
      'Reset your Password (expires in 10 minutes)'
    );
  }
}

module.exports = Email;
