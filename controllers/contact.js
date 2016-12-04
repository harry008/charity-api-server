import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import transporter from '../config/mail';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: path.resolve(path.join(process.cwd(), '.env')) });

export default function contact(req, res) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    const errorMsgs = errors.map(e => e.msg);
    return res.json({
      error: true,
      errors: errorMsgs
    });
  }

  const name = req.body.name;
  const fromEmail = req.body.email;
  const message = req.body.message;

  transporter.sendMail({
    from: fromEmail,
    to: process.env.SITE_EMAIL, // An array if you have multiple recipients.
    subject: `Message from ${name}!`,
    'h:Reply-To': fromEmail,
        // You can use "html:" to send HTML email content. It's magic!
    html: `
<h1>Hey message from ${name}</h1>

${message}`
  }, (err, info) => {
    if (err) {
      console.log(`Error: ${err}`);
      return res.status(500).json({
        error: true,
        message: 'Internal Server error'
      });
    } else {
      console.log('Response:', info);
      return res.json({
        error: false,
        message: 'Your message has been sent. We will reach to you soon!'
      });
    }
  });
}
