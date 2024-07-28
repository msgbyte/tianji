import {
  ImageContentToken,
  ParagraphContentToken,
  TextContentToken,
  TitleContentToken,
  UrlContentToken,
} from '../type.js';
import { BaseContentTokenizer } from './base.js';

export class TelegramContentTokenizer extends BaseContentTokenizer {
  parseImage(token: ImageContentToken) {
    return '';
  }

  parseText(token: TextContentToken): string {
    return this.parseEntityCharacter(token.content);
  }

  parseTitle(token: TitleContentToken) {
    return `\n<b>${this.parseEntityCharacter(token.content)}</b>\n`;
  }

  parseParagraph(token: ParagraphContentToken) {
    return `\n${this.parseEntityCharacter(token.content)}\n`;
  }

  parseUrl(token: UrlContentToken): string {
    return `<a href="${token.url}">${token.title ?? token.url}</a>`;
  }

  private parseEntityCharacter(input: string): string {
    return input
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('&', '&amp;');
  }
}
