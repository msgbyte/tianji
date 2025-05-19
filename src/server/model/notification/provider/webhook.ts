import { NotificationProvider } from './type.js';
import { baseContentTokenizer } from '../token/index.js';
import axios from 'axios';
import dayjs from 'dayjs';

interface WebhookPayload {
  webhookUrl: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const webhook: NotificationProvider = {
  send: async (notification, title, message, payload) => {
    const notificationPayload =
      notification.payload as unknown as WebhookPayload;
    const webhookUrl = notificationPayload.webhookUrl;

    const content = baseContentTokenizer.parse(message);

    await axios.post(webhookUrl, {
      notification,
      title,
      content,
      raw: message,
      payload,
      time: dayjs().toISOString(),
    });
  },
};
