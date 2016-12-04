import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */

dotenv.config({ path: path.join(process.cwd(), '.env') });

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.SITE_EMAIL, // Your email id
    pass: process.env.SITE_EMAILPASS // Your password
  }
});

export default transporter;
