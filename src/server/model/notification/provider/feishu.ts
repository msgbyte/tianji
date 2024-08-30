import { NotificationProvider } from './type.js';
import { markdownContentTokenizer } from '../token/index.js';
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

    const content = markdownContentTokenizer.parse(message);

    // Document: https://open.larksuite.com/document/common-capabilities/message-card/message-cards-content/using-markdown-tags
    await axios.post(webhookUrl, {
      msg_type: 'interactive',
      card: {
        elements: [
          {
            tag: 'markdown',
            content,
          },
        ],
        header: {
          title: {
            content: title,
            tag: 'plain_text',
          },
          template: 'blue',
        },
      },
    });
  },
};
