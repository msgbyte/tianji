import { NotificationProvider } from './type.js';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { htmlContentTokenizer } from '../token/index.js';
import { generateSMTPHTML } from '../../../utils/smtp.js';

interface SMTPPayload {
  hostname: string;
  port: number;
  security: boolean;
  ignoreTLS: boolean;
  username: string;
  password: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const smtp: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as SMTPPayload;

    const config: SMTPTransport.Options = {
      host: payload.hostname,
      port: payload.port,
      secure: payload.security,
      ignoreTLS: payload.ignoreTLS,
    };

    if (payload.username || payload.password) {
      config.auth = {
        user: payload.username,
        pass: payload.password,
      };
    }

    const subject = title;
    const bodyTextContent = htmlContentTokenizer.parse(message);

    const transporter = nodemailer.createTransport(config);
    await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: subject,
      html: generateSMTPHTML(bodyTextContent),
    });
  },
};
