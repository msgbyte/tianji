import { NotificationProvider } from './type';
import { baseContentTokenizer } from '../token';
import execa from 'execa';

interface ApprisePayload {
  appriseUrl: string;
}

// Fork from https://github.com/louislam/uptime-kuma/blob/HEAD/server/notification-providers/smtp.js
export const apprise: NotificationProvider = {
  send: async (notification, title, message) => {
    const payload = notification.payload as unknown as ApprisePayload;

    const content = baseContentTokenizer.parse(message);

    const args = ['-vv', '-b', content, payload.appriseUrl];
    if (title) {
      args.push('-t');
      args.push(title);
    }

    const { stdout } = await execa('apprise', args);

    const output = stdout
      ? stdout.toString()
      : 'ERROR: maybe apprise not found';

    if (output) {
      if (output.includes('ERROR')) {
        throw new Error(output);
      }
    }
  },
};
