const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jande Vincent <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if(process.env.NODE_ENV==="production"){
 //MAIL GUN
 return nodemailer.createTransport({
  host: process.env.EMAIL_PRODUCTION_HOST,
  port: process.env.EMAIL_PRODUCTION_PORT,
  auth: {
    user: process.env.EMAIL_PRODUCTION_USERNAME,
    pass: process.env.EMAIL_PRODUCTION_PASSWORD
  }})
 }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const d=new Date();

    const html = await ejs.renderFile(`${__dirname}/../views/emails/${template}.ejs`, {
      firstName: this.firstName,
      url: this.url,
      subject,year:d.getUTCFullYear(),
  
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
text: htmlToText(html, {
  wordwrap: 130
})
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Janvinsha Stores!');
  }
  async sendConfirmEmail() {
    await this.send('confirmEmail', 'Confirm your email!');
  }
  async sendPasswordReset(){
    await this.send('password', 'Your password reset token valid for only 10minutes!');
  }

};