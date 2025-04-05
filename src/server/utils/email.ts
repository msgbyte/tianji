import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import { env } from './env.js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = nodemailer.createTransport(env.smtp.server);

    const mailOptions = {
      from: env.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // TODO: create a email model to store email history

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email', error);
    throw new Error('Failed to send email');
  }
}
