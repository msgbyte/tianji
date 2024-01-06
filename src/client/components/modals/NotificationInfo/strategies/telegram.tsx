import { Form, Input, Typography } from 'antd';
import React from 'react';
import { useEvent } from '../../../../hooks/useEvent';
import axios from 'axios';
import { AutoLoadingButton } from '../../../AutoLoadingButton';
import { get, last } from 'lodash-es';

export const NotificationTelegram: React.FC = React.memo(() => {
  const token = Form.useWatch(['payload', 'botToken']);
  const form = Form.useFormInstance();

  const getUpdatesUrl = (t: string = '<YOUR BOT TOKEN HERE>') =>
    `https://api.telegram.org/bot${t}/getUpdates`;

  const handleAutoGet = useEvent(async () => {
    const res = await axios.get(getUpdatesUrl(token));

    const update = last(get(res, ['data', 'result']));

    let chatId;
    if (get(update, 'channel_post')) {
      chatId = get(update, 'channel_post.chat.id');
    } else if (get(update, 'message')) {
      chatId = get(update, 'message.chat.id');
    }

    if (chatId) {
      form.setFieldValue(['payload', 'chatId'], String(chatId));
    }
  });

  return (
    <>
      <Form.Item
        label="Bot Token"
        name={['payload', 'botToken']}
        rules={[{ required: true }]}
      >
        <Input.Password />
      </Form.Item>
      <Typography.Paragraph className="text-neutral-500">
        You can get a token from https://t.me/BotFather.
      </Typography.Paragraph>
      <Form.Item label="Chat ID" required={true}>
        <div className="flex gap-2 overflow-hidden">
          <Form.Item
            className="flex-1"
            name={['payload', 'chatId']}
            noStyle={true}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          {token && (
            <AutoLoadingButton onClick={handleAutoGet}>
              Auto Fetch
            </AutoLoadingButton>
          )}
        </div>
      </Form.Item>
      <Typography.Paragraph className="text-neutral-500">
        Support Direct Chat / Group / Channel's Chat ID
      </Typography.Paragraph>
      <Typography.Paragraph className="text-neutral-500">
        You can get your chat ID by sending a message to the bot and going to
        this URL to view the chat_id:
      </Typography.Paragraph>
      <Typography.Link href={getUpdatesUrl(token)} target="_blank">
        {getUpdatesUrl('*'.repeat(token?.length ?? 0))}
      </Typography.Link>
    </>
  );
});
NotificationTelegram.displayName = 'NotificationTelegram';
