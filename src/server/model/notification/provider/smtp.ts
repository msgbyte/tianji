import { NotificationProvider } from './type.js';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { htmlContentTokenizer } from '../token/index.js';

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

function generateSMTPHTML(message: string) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tianji</title>
    <style>
      img {
        max-width: 100%;
      }
    </style>
  </head>
  <body style="background-color: #fafafa;">
    <div style="width: 640px; margin: auto;">
      <header style="margin-bottom: 10px; padding-top: 10px; text-align: center;">
        <img src="https://tianji.msgbyte.com/img/logo@128.png" width="50" height="50" />
      </header>
      <div style="background-color: #fff; border: 1px solid #dddddd; padding: 36px; margin-bottom: 10px;">
        ${message}
      </div>
      <footer style="text-align: center;">
        <div>
          Sent with ❤ by Tianji.
        </div>
        <div>
          <a href="https://github.com/msgbyte/tianji" target="_blank">Github</a>
        </div>
      </footer>
    </div>
  </body>
  </html>
  `;
}
