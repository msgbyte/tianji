import { NotificationProvider } from './type';
import { baseContentTokenizer } from '../token';
import axios from 'axios';

interface WebhookPayload {
  webhookUrl: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const webhook: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as WebhookPayload;
    const webhookUrl = payload.webhookUrl;

    const content = baseContentTokenizer.parse(message);

    await axios.post(webhookUrl, {
      notification,
      content,
      raw: message,
    });
  },
};
