import { NotificationProvider } from './type.js';
import { baseContentTokenizer } from '../token/index.js';
import axios from 'axios';
import dayjs from 'dayjs';

interface TeamsWebhookPayload {
  teamsWebhookUrl: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const teams: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as TeamsWebhookPayload;
    const teamsWebhookUrl = payload.teamsWebhookUrl;

    const text = baseContentTokenizer.parse(message);

    await axios.post(teamsWebhookUrl, {
      notification,
      title,
      text,
      raw: message,
      time: dayjs().toISOString(),
    });
  },
};
