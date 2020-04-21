const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //activate the less secure app options
    //use sendgrid for mass emails in production, gmail has limited emails and not good for prod apps.
    //we're gonna use mail trap for development
  });

  //2) define the email address option
  const mailOptions = {
    from: "ADMIN <admin@noreply.org>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  await transporter.sendMail(mailOptions);
  //3 send the email with node mailer
};

module.exports = sendEmail;
