import { NotificationProvider } from './type.js';
import { telegramContentTokenizer, token } from '../token/index.js';
import axios from 'axios';
import { ImageContentToken } from '../token/type.js';

interface TelegramPayload {
  botToken: string;
  chatId: string;
}

export const telegram: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as TelegramPayload;
    const { botToken, chatId } = payload;

    const text = telegramContentTokenizer.parse([
      token.title(title, 1),
      ...message,
    ]);

    // send text part
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });

    // send image
    const imageTokens = message.filter(
      (m): m is ImageContentToken => m.type === 'image'
    );
    if (imageTokens.length > 0) {
      if (imageTokens.length === 1) {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          chat_id: chatId,
          photo: imageTokens[0].url,
        });
      } else {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          chat_id: chatId,
          media: imageTokens.map((t) => ({
            type: 'photo',
            media: t.url,
          })),
        });
      }
    }
  },
};
