import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import { env } from './env.js';
import dayjs from 'dayjs';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  button?: { title: string; url: string };
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = nodemailer.createTransport(env.smtp.server);

    const mailOptions = {
      from: env.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.body
        ? generateSMTPHTML(options.body, options.button)
        : undefined,
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

export function generateSMTPHTML(
  body: string,
  button?: { title: string; url: string }
) {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="ie=edge" />
  <title>Tianji Email Notification</title>
</head>
<body style="margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; color: #1a1a1a; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 0;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 640px; margin: 0 auto; padding: 0; background-color: transparent;">
          <tr>
            <td align="center" style="padding: 0 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="https://tianji.msgbyte.com/img/logo@128.png" width="64" height="64" alt="Tianji" style="display: block; border: 0; height: auto; line-height: 100%; max-width: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border-radius: 6px; margin-top: 16px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color: #0f172a; font-size: 28px; font-weight: 600; letter-spacing: -0.5px; margin: 0; padding: 0;">Tianji</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #64748b; font-size: 16px; margin-top: 4px; margin: 0; padding: 0;">Insight into everything</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; padding: 48px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    ${body}
                  </td>
                </tr>

                ${
                  button
                    ? `
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center" bgcolor="#0f172a" style="border-radius: 6px;">
                              <a href="${button.url}" target="_blank" style="display: inline-block; font-weight: 500; text-align: center; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 16px;">${button.title}</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`
                    : ''
                }

                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="height: 1px; background-color: #e5e7eb;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; padding: 0; color: #475569; font-size: 15px;">
                      If you did not expect to receive this email, please ignore it or contact the system administrator.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; padding: 0; color: #475569; font-size: 15px;">
                      We hope you enjoy using the service,<br/>
                      Tianji Team
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://github.com/msgbyte/tianji" target="_blank" style="display: inline-block; margin: 0 6px;">
                      <img src="https://tianji.msgbyte.com/img/social/github.png" width="24" height="24" alt="GitHub" style="border: 0; height: auto; line-height: 100%; max-width: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; color: #0f172a;" />
                    </a>
                    <a href="https://twitter.com/moonrailgun" target="_blank" style="display: inline-block; margin: 0 6px;">
                      <img src="https://tianji.msgbyte.com/img/social/x.png" width="24" height="24" alt="Twitter" style="border: 0; height: auto; line-height: 100%; max-width: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; color: #0f172a;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://github.com/msgbyte/tianji" style="display: inline-block; font-size: 14px; color: #0f172a; text-decoration: none; margin: 0 8px;" target="_blank">GitHub</a>
                    <a href="https://tianji.msgbyte.com/docs/intro" style="display: inline-block; font-size: 14px; color: #0f172a; text-decoration: none; margin: 0 8px;" target="_blank">Docs</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="font-size: 14px; color: #64748b; margin: 0; padding: 0;">
                      © ${dayjs().year()} Tianji. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
