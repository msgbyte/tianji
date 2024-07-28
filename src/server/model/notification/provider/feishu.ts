import { NotificationProvider } from './type.js';
import { baseContentTokenizer } from '../token/index.js';
import axios from 'axios';

interface FeishuPayload {
  webhookUrl: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const feishu: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as FeishuPayload;
    const webhookUrl = payload.webhookUrl;
    if (
      !webhookUrl.startsWith('https://open.feishu.cn/open-apis/bot/v2/hook')
    ) {
      throw new Error('Is not a valid feishu webhook url');
    }

    const content = baseContentTokenizer.parse(message);

    await axios.post(webhookUrl, {
      msg_type: 'interactive',
      card: {
        elements: [
          {
            tag: 'div',
            text: {
              content,
              tag: 'plain_text',
            },
          },
        ],
        header: {
          title: {
            content: title,
            tag: 'plain_text',
          },
        },
      },
    });
  },
};
