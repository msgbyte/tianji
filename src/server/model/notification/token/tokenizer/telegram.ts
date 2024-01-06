import { ImageContentToken, TitleContentToken } from '../type';
import { MarkdownContentTokenizer } from './markdown';

export class TelegramContentTokenizer extends MarkdownContentTokenizer {
  parseImage(token: ImageContentToken) {
    return '';
  }

  parseTitle(token: TitleContentToken) {
    if (token.level === 1) {
      return `\n\\# ${token.content}\n`;
    }
    if (token.level === 2) {
      return `\n\\#\\# ${token.content}\n`;
    }
    if (token.level === 3) {
      return `\n\\#\\#\\# ${token.content}\n`;
    }

    return `\n${token.content}\n`;
  }
}
